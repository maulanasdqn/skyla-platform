use crate::application::catalog::Catalog;
use crate::application::worker;
use crate::domain::{Dialogue, Job};
use crate::error::AppError;
use anyhow::{anyhow, Result};
use skyla_engine::KvPrecision;
use skyla_types::{ChatRequest, Info, ModelEntry, ModelList, ServerMessage};
use std::path::PathBuf;
use std::sync::{mpsc, Arc, RwLock};
use tokio::sync::mpsc::{unbounded_channel, UnboundedReceiver, UnboundedSender};
use tokio::sync::oneshot;

#[derive(Clone)]
pub struct EngineHandle {
    jobs: mpsc::Sender<Job>,
    root: Arc<PathBuf>,
    catalog: Arc<RwLock<Catalog>>,
}

fn unavailable<T>(_: T) -> AppError {
    AppError::Unavailable("the engine thread has stopped".into())
}

impl EngineHandle {
    pub fn spawn(model: PathBuf, root: PathBuf, context: usize, kv: KvPrecision) -> Result<Self> {
        let catalog = Catalog::scan(&root);
        let (jobs, inbox) = mpsc::channel();
        let (ready_tx, ready_rx) = mpsc::channel();
        let start = (catalog.id_of(&model), model);
        std::thread::Builder::new()
            .name("skyla-engine".into())
            .spawn(move || worker::run(start, context, kv, inbox, ready_tx))?;
        ready_rx
            .recv()
            .map_err(|_| anyhow!("engine thread exited during startup"))?
            .map_err(|e| anyhow!(e))?;
        Ok(Self {
            jobs,
            root: Arc::new(root),
            catalog: Arc::new(RwLock::new(catalog)),
        })
    }

    fn catalog(&self) -> Catalog {
        self.catalog.read().map(|c| c.clone()).unwrap_or_default()
    }

    fn send(&self, job: Job) -> Result<(), AppError> {
        self.jobs.send(job).map_err(unavailable)
    }

    fn rescan(&self) -> Vec<ModelEntry> {
        let fresh = Catalog::scan(&self.root);
        let models = fresh.models();
        if let Ok(mut c) = self.catalog.write() {
            *c = fresh;
        }
        models
    }

    pub async fn models(&self) -> Result<ModelList, AppError> {
        let models = self.rescan();
        let info = self.info().await?;
        Ok(ModelList {
            models,
            loaded: info.loaded.then_some(info.model_id),
        })
    }

    pub async fn info(&self) -> Result<Info, AppError> {
        let (tx, rx) = oneshot::channel();
        self.send(Job::Info(tx))?;
        rx.await.map_err(unavailable)
    }

    pub async fn unload(&self) -> Result<Info, AppError> {
        let (tx, rx) = oneshot::channel();
        self.send(Job::Unload(tx))?;
        rx.await.map_err(unavailable)
    }

    pub async fn load(&self, id: &str) -> Result<Info, AppError> {
        let (entry, path) = self
            .catalog()
            .find(id)
            .ok_or_else(|| AppError::BadRequest(format!("unknown model {id}")))?;
        if !entry.supported {
            return Err(AppError::BadRequest(format!(
                "{} uses the {} architecture, which Skyla does not support yet",
                entry.name, entry.arch
            )));
        }
        let (tx, rx) = oneshot::channel();
        self.send(Job::Load {
            id: entry.id,
            path,
            reply: tx,
        })?;
        rx.await.map_err(unavailable)?.map_err(AppError::Unavailable)
    }

    pub fn chat(&self, request: ChatRequest) -> Result<UnboundedReceiver<ServerMessage>, AppError> {
        let dialogue =
            Dialogue::parse(&request.messages, request.settings.system.as_deref()).map_err(AppError::BadRequest)?;
        if let Some(id) = &request.model {
            if self.catalog().find(id).is_none() && !self.rescan().iter().any(|m| &m.id == id) {
                return Err(AppError::BadRequest(format!("unknown model {id}")));
            }
        }
        let (events, outbox) = unbounded_channel();
        let engine = self.clone();
        tokio::spawn(async move {
            if let Some(id) = request.model {
                if let Err(message) = engine.switch(&id, &events).await {
                    let _ = events.send(ServerMessage::Error { message });
                    return;
                }
            }
            let job = Job::Chat {
                dialogue,
                settings: request.settings,
                events: events.clone(),
            };
            if engine.send(job).is_err() {
                let _ = events.send(ServerMessage::Error {
                    message: "the engine thread has stopped".into(),
                });
            }
        });
        Ok(outbox)
    }

    async fn switch(&self, id: &str, events: &UnboundedSender<ServerMessage>) -> Result<(), String> {
        let current = self.info().await.map_err(AppError::into_message)?;
        if current.model_id == id {
            return Ok(());
        }
        let _ = events.send(ServerMessage::Loading { id: id.to_string() });
        let info = self.load(id).await.map_err(AppError::into_message)?;
        let _ = events.send(ServerMessage::Info(info));
        Ok(())
    }
}

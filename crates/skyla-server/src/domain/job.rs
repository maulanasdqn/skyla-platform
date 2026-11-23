use crate::domain::Dialogue;
use skyla_types::{Info, ServerMessage, Settings};
use std::path::PathBuf;
use tokio::sync::{mpsc, oneshot};

pub enum Job {
    Info(oneshot::Sender<Info>),
    Unload(oneshot::Sender<Info>),
    Chat {
        dialogue: Dialogue,
        settings: Settings,
        events: mpsc::UnboundedSender<ServerMessage>,
    },
    Load {
        id: String,
        path: PathBuf,
        reply: oneshot::Sender<Result<Info, String>>,
    },
}

mod application;
mod domain;
mod error;
mod infrastructure;

use anyhow::Result;
use application::{EngineHandle, ImageService};
use infrastructure::http::ServiceToken;
use skyla_engine::KvPrecision;
use std::net::SocketAddr;
use std::path::PathBuf;
use std::sync::Arc;
use tokio::net::TcpListener;

pub struct Config {
    pub model: PathBuf,
    pub context: usize,
    pub kv: KvPrecision,
    pub addr: SocketAddr,
    pub models: Option<PathBuf>,
    pub image_models: PathBuf,
    pub image_tool: PathBuf,
    pub token: Option<String>,
}

pub fn serve(config: Config) -> Result<()> {
    let root = config.models.clone().unwrap_or_else(|| {
        let dir = config.model.parent().unwrap_or(&config.model);
        dir.parent().unwrap_or(dir).to_path_buf()
    });
    let token = config.token.clone().filter(|t| !t.is_empty());
    if token.is_none() && !config.addr.ip().is_loopback() {
        eprintln!(
            "warning: {} is reachable from other machines and no service token is set",
            config.addr
        );
    }
    println!("models under {}", root.display());
    println!("loading {} ...", config.model.display());
    let engine = EngineHandle::spawn(config.model.clone(), root, config.context, config.kv)?;
    let images = ImageService::new(config.image_models.clone(), config.image_tool.clone());
    println!("image models under {}", config.image_models.display());
    let runtime = tokio::runtime::Builder::new_multi_thread().enable_all().build()?;
    runtime.block_on(async move {
        let app = infrastructure::http::router(engine, images, ServiceToken(token.map(Arc::from)));
        let listener = TcpListener::bind(config.addr).await?;
        println!("inference service on http://{}/v1", listener.local_addr()?);
        axum::serve(listener, app).await?;
        Ok(())
    })
}

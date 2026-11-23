use super::auth::{require, ServiceToken};
use super::{chat, handlers, images};
use crate::application::{EngineHandle, ImageService};
use axum::middleware::from_fn_with_state;
use axum::routing::{get, post};
use axum::{Extension, Router};
use tower_http::services::ServeDir;

pub fn router(engine: EngineHandle, images: ImageService, token: ServiceToken) -> Router {
    let v1 = Router::new()
        .route("/info", get(handlers::info))
        .route("/models", get(handlers::models))
        .route("/models/load", post(handlers::load))
        .route("/models/unload", post(handlers::unload))
        .route("/chat", post(chat::chat))
        .route("/images", get(images::gallery))
        .route("/images/models", get(images::models))
        .route("/images/status", get(images::status))
        .route("/images/generate", post(images::generate))
        .route("/images/cancel", post(images::cancel))
        .nest_service("/images/files", ServeDir::new(images.outputs()))
        .with_state(engine)
        .layer(Extension(images))
        .layer(from_fn_with_state(token, require));
    Router::new().nest("/v1", v1)
}

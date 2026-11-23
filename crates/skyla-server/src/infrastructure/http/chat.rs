use crate::application::EngineHandle;
use crate::error::AppError;
use axum::body::{Body, Bytes};
use axum::extract::State;
use axum::http::header::CONTENT_TYPE;
use axum::response::{IntoResponse, Response};
use axum::Json;
use futures_util::stream;
use skyla_types::{ChatRequest, ServerMessage};
use std::convert::Infallible;
use tokio::sync::mpsc::UnboundedReceiver;

const NDJSON: &str = "application/x-ndjson";

fn line(message: &ServerMessage) -> Bytes {
    let mut text = serde_json::to_string(message).unwrap_or_default();
    text.push('\n');
    Bytes::from(text)
}

fn lines(outbox: UnboundedReceiver<ServerMessage>) -> Body {
    Body::from_stream(stream::unfold(outbox, |mut outbox| async move {
        let message = outbox.recv().await?;
        Some((Ok::<_, Infallible>(line(&message)), outbox))
    }))
}

pub async fn chat(State(engine): State<EngineHandle>, Json(request): Json<ChatRequest>) -> Result<Response, AppError> {
    let outbox = engine.chat(request)?;
    Ok(([(CONTENT_TYPE, NDJSON)], lines(outbox)).into_response())
}

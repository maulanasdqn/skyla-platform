use crate::application::EngineHandle;
use crate::error::AppError;
use axum::extract::State;
use axum::Json;
use skyla_types::{Info, LoadRequest, ModelList};

pub async fn info(State(engine): State<EngineHandle>) -> Result<Json<Info>, AppError> {
    Ok(Json(engine.info().await?))
}

pub async fn models(State(engine): State<EngineHandle>) -> Result<Json<ModelList>, AppError> {
    Ok(Json(engine.models().await?))
}

pub async fn load(
    State(engine): State<EngineHandle>,
    Json(request): Json<LoadRequest>,
) -> Result<Json<Info>, AppError> {
    Ok(Json(engine.load(&request.id).await?))
}

pub async fn unload(State(engine): State<EngineHandle>) -> Result<Json<Info>, AppError> {
    Ok(Json(engine.unload().await?))
}

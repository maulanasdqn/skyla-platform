use crate::error::AppError;
use axum::extract::{Request, State};
use axum::http::header::AUTHORIZATION;
use axum::middleware::Next;
use axum::response::Response;
use std::sync::Arc;

#[derive(Clone)]
pub struct ServiceToken(pub Option<Arc<str>>);

fn same(a: &[u8], b: &[u8]) -> bool {
    a.len() == b.len() && a.iter().zip(b).fold(0u8, |acc, (x, y)| acc | (x ^ y)) == 0
}

pub async fn require(State(token): State<ServiceToken>, request: Request, next: Next) -> Result<Response, AppError> {
    let Some(expected) = token.0 else {
        return Ok(next.run(request).await);
    };
    let presented = request
        .headers()
        .get(AUTHORIZATION)
        .and_then(|v| v.to_str().ok())
        .and_then(|v| v.strip_prefix("Bearer "));
    match presented {
        Some(given) if same(given.as_bytes(), expected.as_bytes()) => Ok(next.run(request).await),
        _ => Err(AppError::Unauthorized),
    }
}

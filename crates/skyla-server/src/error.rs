use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum::Json;
use serde_json::json;

pub enum AppError {
    BadRequest(String),
    Unauthorized,
    Unavailable(String),
}

impl AppError {
    pub fn into_message(self) -> String {
        match self {
            AppError::BadRequest(msg) | AppError::Unavailable(msg) => msg,
            AppError::Unauthorized => "missing or wrong service token".into(),
        }
    }
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let status = match self {
            AppError::BadRequest(_) => StatusCode::BAD_REQUEST,
            AppError::Unauthorized => StatusCode::UNAUTHORIZED,
            AppError::Unavailable(_) => StatusCode::SERVICE_UNAVAILABLE,
        };
        (status, Json(json!({ "message": self.into_message() }))).into_response()
    }
}

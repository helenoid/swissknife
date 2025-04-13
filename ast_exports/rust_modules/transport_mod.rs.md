## Module: transport - mod.rs
```rust
use async_trait::async_trait;
use mcp_core::protocol::JsonRpcMessage;
use std::collections::HashMap;
use thiserror::Error;
use tokio::sync::{mpsc, oneshot, RwLock};
pub type BoxError = Box<dyn std::error::Error + Sync + Send>;
pub enum Error {
pub struct TransportMessage {
pub trait Transport {
pub trait TransportHandle: Send + Sync + Clone + 'static {
pub async fn send_message(
pub struct PendingRequests {
pub mod stdio;
pub use stdio::StdioTransport;
pub mod sse;
pub use sse::SseTransport;
```

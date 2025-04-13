## Module: memory - mod.rs
```rust
use async_trait::async_trait;
use etcetera::{choose_app_strategy, AppStrategy};
use indoc::formatdoc;
use serde_json::{json, Value};
use std::{
use mcp_core::{
use mcp_server::router::CapabilitiesBuilder;
use mcp_server::Router;
pub struct MemoryRouter {
```

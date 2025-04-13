## Module: tutorial - mod.rs
```rust
use anyhow::Result;
use include_dir::{include_dir, Dir};
use indoc::formatdoc;
use serde_json::{json, Value};
use std::{future::Future, pin::Pin};
use mcp_core::{
use mcp_server::router::CapabilitiesBuilder;
use mcp_server::Router;
use mcp_core::content::Content;
pub struct TutorialRouter {
```

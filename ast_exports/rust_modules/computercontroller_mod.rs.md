## Module: computercontroller - mod.rs
```rust
use base64::Engine;
use etcetera::{choose_app_strategy, AppStrategy};
use indoc::{formatdoc, indoc};
use reqwest::{Client, Url};
use serde_json::{json, Value};
use std::{
use tokio::process::Command;
use mcp_core::{
use mcp_server::router::CapabilitiesBuilder;
use mcp_server::Router;
mod docx_tool;
mod pdf_tool;
mod presentation_tool;
mod xlsx_tool;
mod platform;
use platform::{create_system_automation, SystemAutomation};
pub struct ComputerControllerRouter {
```

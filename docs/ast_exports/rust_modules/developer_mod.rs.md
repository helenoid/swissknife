## Module: developer - mod.rs
```rust
mod lang;
mod shell;
use anyhow::Result;
use base64::Engine;
use etcetera::{choose_app_strategy, AppStrategy};
use indoc::formatdoc;
use serde_json::{json, Value};
use std::{
use tokio::process::Command;
use url::Url;
use include_dir::{include_dir, Dir};
use mcp_core::{
use mcp_core::{
use mcp_server::router::CapabilitiesBuilder;
use mcp_server::Router;
use mcp_core::role::Role;
use self::shell::{
use indoc::indoc;
use std::process::Stdio;
use std::sync::{Arc, Mutex};
use xcap::{Monitor, Window};
use ignore::gitignore::{Gitignore, GitignoreBuilder};
pub fn load_prompt_files() -> HashMap<String, Prompt> {
pub struct DeveloperRouter {
mod tests {
```

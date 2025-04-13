# Rust Structures

## File: /home/barberb/swissknife/goose/crates/mcp-server/src/lib.rs

```rust
pub struct ByteTransport<R, W> {
    // Reader is a BufReader on the underlying stream (stdin or similar) buffering
    // the underlying data across poll calls, we clear one line (\n) during each
    // iteration of poll_next from this buffer
    #[pin]
    reader: BufReader<R>,
    #[pin]
    writer: W,
}
```

```rust
pub struct Server<S> {
    service: S,
}
```

## File: /home/barberb/swissknife/goose/crates/mcp-server/src/router.rs

```rust
pub struct CapabilitiesBuilder {
    tools: Option<ToolsCapability>,
    prompts: Option<PromptsCapability>,
    resources: Option<ResourcesCapability>,
}
```

```rust
pub struct RouterService<T>(pub T);

impl<T> Service<JsonRpcRequest> for RouterService<T>
where
    T: Router + Clone + Send + Sync + 'static,
{
    type Response = JsonRpcResponse;
    type Error = BoxError;
    type Future = Pin<Box<dyn Future<Output = Result<Self::Response, Self::Error>> + Send>>;

    fn poll_ready(&mut self, _cx: &mut Context<'_>) -> Poll<Result<(), Self::Error>> {
        Poll::Ready(Ok(()))
    }

    fn call(&mut self, req: JsonRpcRequest) -> Self::Future {
        let this = self.0.clone();

        Box::pin(async move {
            let result = match req.method.as_str() {
                "initialize" => this.handle_initialize(req).await,
                "tools/list" => this.handle_tools_list(req).await,
                "tools/call" => this.handle_tools_call(req).await,
                "resources/list" => this.handle_resources_list(req).await,
                "resources/read" => this.handle_resources_read(req).await,
                "prompts/list" => this.handle_prompts_list(req).await,
                "prompts/get" => this.handle_prompts_get(req).await,
                _ => {
                    let mut response = this.create_response(req.id);
                    response.error = Some(RouterError::MethodNotFound(req.method).into());
                    Ok(response)
                }
            };

            result.map_err(BoxError::from)
        })
    }
}
```

## File: /home/barberb/swissknife/goose/crates/mcp-client/src/client.rs

```rust
pub struct ClientInfo {
    pub name: String,
    pub version: String,
}
```

```rust
pub struct ClientCapabilities {
    // Add fields as needed. For now, empty capabilities are fine.
}
```

```rust
pub struct InitializeParams {
    #[serde(rename = "protocolVersion")]
    pub protocol_version: String,
    pub capabilities: ClientCapabilities,
    #[serde(rename = "clientInfo")]
    pub client_info: ClientInfo,
}
```

```rust
pub struct McpClient<S>
where
    S: Service<JsonRpcMessage, Response = JsonRpcMessage> + Clone + Send + Sync + 'static,
    S::Error: Into<Error>,
    S::Future: Send,
{
    service: Mutex<S>,
    next_id: AtomicU64,
    server_capabilities: Option<ServerCapabilities>,
    server_info: Option<Implementation>,
}
```

## File: /home/barberb/swissknife/goose/crates/mcp-client/src/transport/stdio.rs

```rust
pub struct StdioActor {
    receiver: mpsc::Receiver<TransportMessage>,
    pending_requests: Arc<PendingRequests>,
    _process: Child, // we store the process to keep it alive
    error_sender: mpsc::Sender<Error>,
    stdin: ChildStdin,
    stdout: ChildStdout,
    stderr: ChildStderr,
}
```

```rust
pub struct StdioTransportHandle {
    sender: mpsc::Sender<TransportMessage>,
    error_receiver: Arc<Mutex<mpsc::Receiver<Error>>>,
}
```

```rust
pub struct StdioTransport {
    command: String,
    args: Vec<String>,
    env: HashMap<String, String>,
}
```

## File: /home/barberb/swissknife/goose/crates/mcp-client/src/transport/mod.rs

```rust
pub struct TransportMessage {
    /// The JSON-RPC message to send
    pub message: JsonRpcMessage,
    /// Channel to receive the response on (None for notifications)
    pub response_tx: Option<oneshot::Sender<Result<JsonRpcMessage, Error>>>,
}
```

```rust
pub struct PendingRequests {
    requests: RwLock<HashMap<String, oneshot::Sender<Result<JsonRpcMessage, Error>>>>,
}
```

## File: /home/barberb/swissknife/goose/crates/mcp-client/src/transport/sse.rs

```rust
pub struct SseActor {
    /// Receives messages (requests/notifications) from the handle
    receiver: mpsc::Receiver<TransportMessage>,
    /// Map of request-id -> oneshot sender
    pending_requests: Arc<PendingRequests>,
    /// Base SSE URL
    sse_url: String,
    /// For sending HTTP POST requests
    http_client: HttpClient,
    /// The discovered endpoint for POST requests (once "endpoint" SSE event arrives)
    post_endpoint: Arc<RwLock<Option<String>>>,
}
```

```rust
pub struct SseTransportHandle {
    sender: mpsc::Sender<TransportMessage>,
}
```

```rust
pub struct SseTransport {
    sse_url: String,
    env: HashMap<String, String>,
}
```

## File: /home/barberb/swissknife/goose/crates/mcp-client/src/service.rs

```rust
pub struct McpService<T: TransportHandle> {
    inner: Arc<T>,
}
```

## File: /home/barberb/swissknife/goose/crates/goose-mcp/src/computercontroller/xlsx_tool.rs

```rust
pub struct WorksheetInfo {
    name: String,
    index: usize,
    column_count: usize,
    row_count: usize,
}
```

```rust
pub struct CellValue {
    value: String,
    formula: Option<String>,
}
```

```rust
pub struct RangeData {
    start_row: u32,
    end_row: u32,
    start_col: u32,
    end_col: u32,
    // First dimension is rows, second dimension is columns: values[row_index][column_index]
    values: Vec<Vec<CellValue>>,
}
```

```rust
pub struct XlsxTool {
    workbook: Spreadsheet,
}
```

## File: /home/barberb/swissknife/goose/crates/goose-mcp/src/computercontroller/mod.rs

```rust
pub struct ComputerControllerRouter {
    tools: Vec<Tool>,
    cache_dir: PathBuf,
    active_resources: Arc<Mutex<HashMap<String, Resource>>>,
    http_client: Client,
    instructions: String,
    system_automation: Arc<Box<dyn SystemAutomation + Send + Sync>>,
}
```

## File: /home/barberb/swissknife/goose/crates/goose-mcp/src/computercontroller/platform/macos.rs

```rust
pub struct MacOSAutomation;

impl SystemAutomation for MacOSAutomation {
    fn execute_system_script(&self, script: &str) -> std::io::Result<String> {
        let output = Command::new("osascript").arg("-e").arg(script).output()?;

        Ok(String::from_utf8_lossy(&output.stdout).into_owned())
    }

    fn get_shell_command(&self) -> (&'static str, &'static str) {
        ("bash", "-c")
    }

    fn get_temp_path(&self) -> PathBuf {
        PathBuf::from("/tmp")
    }
}
```

## File: /home/barberb/swissknife/goose/crates/goose-mcp/src/computercontroller/platform/windows.rs

```rust
pub struct WindowsAutomation;

impl SystemAutomation for WindowsAutomation {
    fn execute_system_script(&self, script: &str) -> std::io::Result<String> {
        let output = Command::new("powershell")
            .arg("-NoProfile")
            .arg("-NonInteractive")
            .arg("-Command")
            .arg(script)
            .output()?;

        Ok(String::from_utf8_lossy(&output.stdout).into_owned())
    }

    fn get_shell_command(&self) -> (&'static str, &'static str) {
        ("powershell", "-Command")
    }

    fn get_temp_path(&self) -> PathBuf {
        std::env::var("TEMP")
            .map(PathBuf::from)
            .unwrap_or_else(|_| PathBuf::from(r"C:\Windows\Temp"))
    }
}
```

## File: /home/barberb/swissknife/goose/crates/goose-mcp/src/computercontroller/platform/linux.rs

```rust
pub struct LinuxAutomation {
    display_server: DisplayServer,
}
```

## File: /home/barberb/swissknife/goose/crates/goose-mcp/src/developer/shell.rs

```rust
pub struct ShellConfig {
    pub executable: String,
    pub arg: String,
    pub redirect_syntax: String,
}
```

## File: /home/barberb/swissknife/goose/crates/goose-mcp/src/developer/mod.rs

```rust
pub struct DeveloperRouter {
    tools: Vec<Tool>,
    prompts: Arc<HashMap<String, Prompt>>,
    instructions: String,
    file_history: Arc<Mutex<HashMap<PathBuf, Vec<String>>>>,
    ignore_patterns: Arc<Gitignore>,
}
```

## File: /home/barberb/swissknife/goose/crates/goose-mcp/src/tutorial/mod.rs

```rust
pub struct TutorialRouter {
    tools: Vec<Tool>,
    instructions: String,
}
```

## File: /home/barberb/swissknife/goose/crates/goose-mcp/src/memory/mod.rs

```rust
pub struct MemoryRouter {
    tools: Vec<Tool>,
    instructions: String,
    global_memory_dir: PathBuf,
    local_memory_dir: PathBuf,
}
```

## File: /home/barberb/swissknife/goose/crates/goose-mcp/src/google_drive/oauth_pkce.rs

```rust
pub struct PkceOAuth2Client {
    client: BasicClient<EndpointSet, EndpointNotSet, EndpointNotSet, EndpointNotSet, EndpointSet>,
    credentials_manager: Arc<CredentialsManager>,
    http_client: reqwest::Client,
    project_id: String,
}
```

## File: /home/barberb/swissknife/goose/crates/goose-mcp/src/google_drive/storage.rs

```rust
pub struct CredentialsManager {
    credentials_path: String,
    fallback_to_disk: bool,
    keychain_service: String,
    keychain_username: String,
}
```

## File: /home/barberb/swissknife/goose/crates/goose-mcp/src/google_drive/mod.rs

```rust
pub struct GoogleDriveRouter {
    tools: Vec<Tool>,
    instructions: String,
    drive: DriveHub<HttpsConnector<HttpConnector>>,
    sheets: Sheets<HttpsConnector<HttpConnector>>,
    docs: Docs<HttpsConnector<HttpConnector>>,
    credentials_manager: Arc<CredentialsManager>,
}
```

## File: /home/barberb/swissknife/goose/crates/goose-mcp/src/jetbrains/mod.rs

```rust
pub struct JetBrainsRouter {
    tools: Arc<Mutex<Vec<Tool>>>,
    proxy: Arc<JetBrainsProxy>,
    instructions: String,
}
```

## File: /home/barberb/swissknife/goose/crates/goose-mcp/src/jetbrains/proxy.rs

```rust
pub struct CallToolResult {
    pub content: Vec<Content>,
    pub is_error: bool,
}
```

```rust
pub struct JetBrainsProxy {
    cached_endpoint: Arc<RwLock<Option<String>>>,
    previous_response: Arc<RwLock<Option<String>>>,
    client: Client,
}
```

## File: /home/barberb/swissknife/goose/crates/goose-bench/src/bench_session.rs

```rust
pub struct BenchAgentError {
    pub message: String,
    pub level: String, // ERROR, WARN, etc.
    pub timestamp: DateTime<Utc>,
}
```

```rust
pub struct BenchAgent {
    session: Box<dyn BenchBaseSession>,
    errors: Arc<Mutex<Vec<BenchAgentError>>>,
}
```

## File: /home/barberb/swissknife/goose/crates/goose-bench/src/error_capture.rs

```rust
pub struct ErrorCaptureLayer;

impl Default for ErrorCaptureLayer {
    fn default() -> Self {
        Self
    }
}
```

## File: /home/barberb/swissknife/goose/crates/goose-bench/src/bench_work_dir.rs

```rust
pub struct BenchmarkWorkDir {
    pub base_path: PathBuf,
    pub run_dir: PathBuf,
    pub cwd: PathBuf,
    pub run_id: Option<String>,
}
```

## File: /home/barberb/swissknife/goose/crates/goose-bench/src/eval_suites/evaluation.rs

```rust
pub struct EvalMetric {
    pub name: String,
    pub value: EvalMetricValue,
}
```

```rust
pub struct ExtensionRequirements {
    pub builtin: Vec<String>,
    pub external: Vec<String>,
    pub remote: Vec<String>,
}
```

## File: /home/barberb/swissknife/goose/crates/goose-bench/src/eval_suites/core/developer_image/image.rs

```rust
pub struct DeveloperImage {}

impl DeveloperImage {
    pub fn new() -> Self {
        DeveloperImage {}
    }
}
```

## File: /home/barberb/swissknife/goose/crates/goose-bench/src/eval_suites/core/memory/save_fact.rs

```rust
pub struct MemoryRememberMemory {}

impl MemoryRememberMemory {
    pub fn new() -> Self {
        MemoryRememberMemory {}
    }
}
```

## File: /home/barberb/swissknife/goose/crates/goose-bench/src/eval_suites/core/computercontroller/web_scrape.rs

```rust
pub struct ComputerControllerWebScrape {}

impl ComputerControllerWebScrape {
    pub fn new() -> Self {
        ComputerControllerWebScrape {}
    }
}
```

## File: /home/barberb/swissknife/goose/crates/goose-bench/src/eval_suites/core/computercontroller/script.rs

```rust
pub struct ComputerControllerScript {}

impl ComputerControllerScript {
    pub fn new() -> Self {
        ComputerControllerScript {}
    }
}
```

## File: /home/barberb/swissknife/goose/crates/goose-bench/src/eval_suites/core/example.rs

```rust
pub struct ExampleEval {}

impl ExampleEval {
    pub fn new() -> Self {
        ExampleEval {}
    }
}
```

## File: /home/barberb/swissknife/goose/crates/goose-bench/src/eval_suites/core/developer_search_replace/search_replace.rs

```rust
pub struct DeveloperSearchReplace {}

impl DeveloperSearchReplace {
    pub fn new() -> Self {
        DeveloperSearchReplace {}
    }
}
```

## File: /home/barberb/swissknife/goose/crates/goose-bench/src/eval_suites/core/developer/create_file.rs

```rust
pub struct DeveloperCreateFile {}

impl DeveloperCreateFile {
    pub fn new() -> Self {
        DeveloperCreateFile {}
    }
}
```

## File: /home/barberb/swissknife/goose/crates/goose-bench/src/eval_suites/core/developer/list_files.rs

```rust
pub struct DeveloperListFiles {}

impl DeveloperListFiles {
    pub fn new() -> Self {
        DeveloperListFiles {}
    }
}
```

## File: /home/barberb/swissknife/goose/crates/goose-bench/src/eval_suites/core/developer/simple_repo_clone_test.rs

```rust
pub struct SimpleRepoCloneTest {}

impl SimpleRepoCloneTest {
    pub fn new() -> Self {
        SimpleRepoCloneTest {}
    }
}
```

## File: /home/barberb/swissknife/goose/crates/goose-bench/src/eval_suites/factory.rs

```rust
pub struct EvaluationSuite;

impl EvaluationSuite {
    pub fn from(selector: &str) -> Option<Box<dyn Evaluation>> {
        let registry = eval_registry();
        let map = registry
            .read()
            .expect("Failed to read the benchmark evaluation registry.");

        let constructor = map.get(selector)?;
        let instance = constructor();

        Some(instance)
    }

    pub fn registered_evals() -> Vec<&'static str> {
        let registry = eval_registry();
        let map = registry
            .read()
            .expect("Failed to read the benchmark evaluation registry.");

        let evals: Vec<_> = map.keys().copied().collect();
        evals
    }
    pub fn select(selectors: Vec<String>) -> HashMap<String, Vec<&'static str>> {
        let eval_name_pattern = Regex::new(r":\w+$").unwrap();
        let grouped_by_suite: HashMap<String, Vec<&'static str>> =
            EvaluationSuite::registered_evals()
                .into_iter()
                .filter(|&eval| selectors.is_empty() || matches_any_selectors(eval, &selectors))
                .fold(HashMap::new(), |mut suites, eval| {
                    let suite = match eval_name_pattern.replace(eval, "") {
                        Cow::Borrowed(s) => s.to_string(),
                        Cow::Owned(s) => s,
                    };
                    suites.entry(suite).or_default().push(eval);
                    suites
                });

        grouped_by_suite
    }

    pub fn available_selectors() -> HashMap<String, usize> {
        let mut counts: HashMap<String, usize> = HashMap::new();
        for selector in EvaluationSuite::registered_evals() {
            let parts = selector.split(":").collect::<Vec<_>>();
            for i in 0..parts.len() {
                let sel = parts[..i + 1].join(":");
                *counts.entry(sel).or_insert(0) += 1;
            }
        }
        counts
    }
}
```

## File: /home/barberb/swissknife/goose/crates/goose-bench/src/eval_suites/vibes/flappy_bird.rs

```rust
pub struct FlappyBird {}

impl FlappyBird {
    pub fn new() -> Self {
        FlappyBird {}
    }

    fn check_python_implementation(&self, content: &str) -> bool {
        content.contains("import pygame") &&
        content.contains("pygame.init()") &&
        content.contains("while") && // Game loop
        content.contains("pygame.event.get()") && // Event handling
        content.contains("def main") && // Main function
        content.contains("if __name__ == '__main__'") // Main guard
    }
}
```

## File: /home/barberb/swissknife/goose/crates/goose-bench/src/eval_suites/vibes/goose_wiki.rs

```rust
pub struct GooseWiki {}

impl GooseWiki {
    pub fn new() -> Self {
        GooseWiki {}
    }

    fn check_html_implementation(&self, content: &str) -> bool {
        // Check for basic structure
        let has_basic_structure = content.contains("<html")
            && content.contains("</html>")
            && content.contains("<head")
            && content.contains("</head>")
            && content.contains("<body")
            && content.contains("</body>");

        // Check for Wikipedia-style content
        let has_wiki_elements = content.contains("<h1") && // Has headings
                              (content.contains("<h2") || content.contains("<h3")) && // Has subheadings
                              content.contains("Goose") && // Mentions Goose
                              content.contains("AI") && // Mentions AI
                              (content.contains("<p>") || content.contains("<div")); // Has paragraphs

        has_basic_structure && has_wiki_elements
    }
}
```

## File: /home/barberb/swissknife/goose/crates/goose-bench/src/eval_suites/vibes/squirrel_census.rs

```rust
pub struct SquirrelCensus {}

impl SquirrelCensus {
    pub fn new() -> Self {
        SquirrelCensus {}
    }

    fn check_analysis_results(&self, text: &str) -> (bool, bool, bool) {
        let text_lower = text.to_lowercase();
        let has_central_manhattan =
            text_lower.contains("central manhattan") && text.contains("174");
        let has_tompkins = text_lower.contains("tompkins square park") && text.contains("59");
        let has_gray = text_lower.contains("gray") || text_lower.contains("grey");
        (has_central_manhattan, has_tompkins, has_gray)
    }
}
```

## File: /home/barberb/swissknife/goose/crates/goose-bench/src/eval_suites/vibes/blog_summary.rs

```rust
pub struct BlogSummary {}

impl BlogSummary {
    pub fn new() -> Self {
        BlogSummary {}
    }

    fn check_markdown_numbered_list(&self, text: &str) -> bool {
        // Check if all numbers 1-5 exist in markdown numbered list format
        (1..=5).all(|n| text.contains(&format!("{}.", n)))
    }
}
```

## File: /home/barberb/swissknife/goose/crates/goose-bench/src/eval_suites/vibes/restaurant_research.rs

```rust
pub struct RestaurantResearch {}

impl RestaurantResearch {
    pub fn new() -> Self {
        RestaurantResearch {}
    }

    fn check_markdown_bullets(&self, text: &str) -> bool {
        // Check if there's at least one bullet point and proper markdown formatting
        text.contains("- ") || text.contains("* ")
    }

    fn count_bullet_points(&self, text: &str) -> i64 {
        // Count total bullet points (either - or * style)
        let dash_bullets = text.matches("- ").count();
        let star_bullets = text.matches("* ").count();
        (dash_bullets + star_bullets) as i64
    }
}
```

## File: /home/barberb/swissknife/goose/crates/goose-bench/src/runners/eval_runner.rs

```rust
pub struct EvalRunner {
    config: BenchRunConfig,
}
```

## File: /home/barberb/swissknife/goose/crates/goose-bench/src/runners/model_runner.rs

```rust
pub struct ModelRunner {
    config: BenchRunConfig,
}
```

## File: /home/barberb/swissknife/goose/crates/goose-bench/src/runners/bench_runner.rs

```rust
pub struct BenchRunner {
    config: BenchRunConfig,
}
```

## File: /home/barberb/swissknife/goose/crates/goose-bench/src/reporting.rs

```rust
pub struct EvaluationResult {
    pub name: String,
    pub metrics: Vec<(String, EvalMetricValue)>,
    pub errors: Vec<BenchAgentError>,
}
```

```rust
pub struct SuiteResult {
    pub name: String,
    pub evaluations: Vec<EvaluationResult>,
}
```

```rust
pub struct BenchmarkResults {
    pub provider: String,
    pub start_time: String,
    pub suites: Vec<SuiteResult>,
}
```

## File: /home/barberb/swissknife/goose/crates/goose-bench/src/bench_config.rs

```rust
pub struct BenchToolShimOpt {
    pub use_tool_shim: bool,
    pub tool_shim_model: Option<String>,
}
```

```rust
pub struct BenchModel {
    pub provider: String,
    pub name: String,
    pub parallel_safe: bool,
    pub tool_shim: Option<BenchToolShimOpt>,
}
```

```rust
pub struct BenchEval {
    pub selector: String,
    pub post_process_cmd: Option<PathBuf>,
    pub parallel_safe: bool,
}
```

```rust
pub struct BenchRunConfig {
    pub models: Vec<BenchModel>,
    pub evals: Vec<BenchEval>,
    pub include_dirs: Vec<PathBuf>,
    pub repeat: Option<usize>,
    pub run_id: Option<String>,
    pub eval_result_filename: String,
    pub run_summary_filename: String,
    pub env_file: Option<PathBuf>,
}
```

## File: /home/barberb/swissknife/goose/crates/mcp-core/src/resource.rs

```rust
pub struct Resource {
    /// URI representing the resource location (e.g., "file:///path/to/file" or "str:///content")
    pub uri: String,
    /// Name of the resource
    pub name: String,
    /// Optional description of the resource
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    /// MIME type of the resource content ("text" or "blob")
    #[serde(default = "default_mime_type")]
    pub mime_type: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub annotations: Option<Annotations>,
}
```

## File: /home/barberb/swissknife/goose/crates/mcp-core/src/content.rs

```rust
pub struct Annotations {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub audience: Option<Vec<Role>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub priority: Option<f32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub timestamp: Option<DateTime<Utc>>,
}
```

```rust
pub struct TextContent {
    pub text: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub annotations: Option<Annotations>,
}
```

```rust
pub struct ImageContent {
    pub data: String,
    pub mime_type: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub annotations: Option<Annotations>,
}
```

```rust
pub struct EmbeddedResource {
    pub resource: ResourceContents,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub annotations: Option<Annotations>,
}
```

## File: /home/barberb/swissknife/goose/crates/mcp-core/src/protocol.rs

```rust
pub struct JsonRpcRequest {
    pub jsonrpc: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<u64>,
    pub method: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub params: Option<Value>,
}
```

```rust
pub struct JsonRpcResponse {
    pub jsonrpc: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub result: Option<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<ErrorData>,
}
```

```rust
pub struct JsonRpcNotification {
    pub jsonrpc: String,
    pub method: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub params: Option<Value>,
}
```

```rust
pub struct JsonRpcError {
    pub jsonrpc: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<u64>,
    pub error: ErrorData,
}
```

```rust
pub struct ErrorData {
    /// The error type that occurred.
    pub code: i32,

    /// A short description of the error. The message SHOULD be limited to a concise single sentence.
    pub message: String,

    /// Additional information about the error. The value of this member is defined by the
    /// sender (e.g. detailed error information, nested errors etc.).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<Value>,
}
```

```rust
pub struct InitializeResult {
    pub protocol_version: String,
    pub capabilities: ServerCapabilities,
    pub server_info: Implementation,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub instructions: Option<String>,
}
```

```rust
pub struct Implementation {
    pub name: String,
    pub version: String,
}
```

```rust
pub struct ServerCapabilities {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub prompts: Option<PromptsCapability>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub resources: Option<ResourcesCapability>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tools: Option<ToolsCapability>,
    // Add other capabilities as needed
}
```

```rust
pub struct PromptsCapability {
    pub list_changed: Option<bool>,
}
```

```rust
pub struct ResourcesCapability {
    pub subscribe: Option<bool>,
    pub list_changed: Option<bool>,
}
```

```rust
pub struct ToolsCapability {
    pub list_changed: Option<bool>,
}
```

```rust
pub struct ListResourcesResult {
    pub resources: Vec<Resource>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub next_cursor: Option<String>,
}
```

```rust
pub struct ReadResourceResult {
    pub contents: Vec<ResourceContents>,
}
```

```rust
pub struct ListToolsResult {
    pub tools: Vec<Tool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub next_cursor: Option<String>,
}
```

```rust
pub struct CallToolResult {
    pub content: Vec<Content>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub is_error: Option<bool>,
}
```

```rust
pub struct ListPromptsResult {
    pub prompts: Vec<Prompt>,
}
```

```rust
pub struct GetPromptResult {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    pub messages: Vec<PromptMessage>,
}
```

```rust
pub struct EmptyResult {}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn test_notification_conversion() {
        let raw = JsonRpcRaw {
            jsonrpc: "2.0".to_string(),
            id: None,
            method: Some("notify".to_string()),
            params: Some(json!({"key": "value"})),
            result: None,
            error: None,
        };

        let message = JsonRpcMessage::try_from(raw).unwrap();
        match message {
            JsonRpcMessage::Notification(n) => {
                assert_eq!(n.jsonrpc, "2.0");
                assert_eq!(n.method, "notify");
                assert_eq!(n.params.unwrap(), json!({"key": "value"}));
            }
            _ => panic!("Expected Notification"),
        }
    }

    #[test]
    fn test_request_conversion() {
        let raw = JsonRpcRaw {
            jsonrpc: "2.0".to_string(),
            id: Some(1),
            method: Some("request".to_string()),
            params: Some(json!({"key": "value"})),
            result: None,
            error: None,
        };

        let message = JsonRpcMessage::try_from(raw).unwrap();
        match message {
            JsonRpcMessage::Request(r) => {
                assert_eq!(r.jsonrpc, "2.0");
                assert_eq!(r.id, Some(1));
                assert_eq!(r.method, "request");
                assert_eq!(r.params.unwrap(), json!({"key": "value"}));
            }
            _ => panic!("Expected Request"),
        }
    }
}
```

## File: /home/barberb/swissknife/goose/crates/mcp-core/src/tool.rs

```rust
pub struct ToolAnnotations {
    /// A human-readable title for the tool.
    pub title: Option<String>,

    /// If true, the tool does not modify its environment.
    ///
    /// Default: false
    #[serde(default)]
    pub read_only_hint: bool,

    /// If true, the tool may perform destructive updates to its environment.
    /// If false, the tool performs only additive updates.
    ///
    /// (This property is meaningful only when `read_only_hint == false`)
    ///
    /// Default: true
    #[serde(default = "default_true")]
    pub destructive_hint: bool,

    /// If true, calling the tool repeatedly with the same arguments
    /// will have no additional effect on its environment.
    ///
    /// (This property is meaningful only when `read_only_hint == false`)
    ///
    /// Default: false
    #[serde(default)]
    pub idempotent_hint: bool,

    /// If true, this tool may interact with an "open world" of external
    /// entities. If false, the tool's domain of interaction is closed.
    /// For example, the world of a web search tool is open, whereas that
    /// of a memory tool is not.
    ///
    /// Default: true
    #[serde(default = "default_true")]
    pub open_world_hint: bool,
}
```

```rust
pub struct Tool {
    /// The name of the tool
    pub name: String,
    /// A description of what the tool does
    pub description: String,
    /// A JSON Schema object defining the expected parameters for the tool
    pub input_schema: Value,
    /// Optional additional tool information.
    pub annotations: Option<ToolAnnotations>,
}
```

```rust
pub struct ToolCall {
    /// The name of the tool to execute
    pub name: String,
    /// The parameters for the execution
    pub arguments: Value,
}
```

## File: /home/barberb/swissknife/goose/crates/mcp-core/src/prompt.rs

```rust
pub struct Prompt {
    /// The name of the prompt
    pub name: String,
    /// Optional description of what the prompt does
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    /// Optional arguments that can be passed to customize the prompt
    #[serde(skip_serializing_if = "Option::is_none")]
    pub arguments: Option<Vec<PromptArgument>>,
}
```

```rust
pub struct PromptArgument {
    /// The name of the argument
    pub name: String,
    /// A description of what the argument is used for
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    /// Whether this argument is required
    #[serde(skip_serializing_if = "Option::is_none")]
    pub required: Option<bool>,
}
```

```rust
pub struct PromptMessage {
    /// The role of the message sender
    pub role: PromptMessageRole,
    /// The content of the message
    pub content: PromptMessageContent,
}
```

```rust
pub struct PromptTemplate {
    pub id: String,
    pub template: String,
    pub arguments: Vec<PromptArgumentTemplate>,
}
```

```rust
pub struct PromptArgumentTemplate {
    pub name: String,
    pub description: Option<String>,
    pub required: Option<bool>,
}
```

## File: /home/barberb/swissknife/goose/crates/goose-cli/src/session/output.rs

```rust
pub struct ThinkingIndicator {
    spinner: Option<cliclack::ProgressBar>,
}
```

```rust
pub struct PromptInfo {
    pub name: String,
    pub description: Option<String>,
    pub arguments: Option<Vec<PromptArgument>>,
    pub extension: Option<String>,
}
```

## File: /home/barberb/swissknife/goose/crates/goose-cli/src/session/builder.rs

```rust
pub struct SessionBuilderConfig {
    /// Optional identifier for the session (name or path)
    pub identifier: Option<Identifier>,
    /// Whether to resume an existing session
    pub resume: bool,
    /// List of stdio extension commands to add
    pub extensions: Vec<String>,
    /// List of remote extension commands to add
    pub remote_extensions: Vec<String>,
    /// List of builtin extension commands to add
    pub builtins: Vec<String>,
    /// List of extensions to enable, enable only this set and ignore configured ones
    pub extensions_override: Option<Vec<ExtensionConfig>>,
    /// Any additional system prompt to append to the default
    pub additional_system_prompt: Option<String>,
    /// Enable debug printing
    pub debug: bool,
}
```

## File: /home/barberb/swissknife/goose/crates/goose-cli/src/session/input.rs

```rust
pub struct PromptCommandOptions {
    pub name: String,
    pub info: bool,
    pub arguments: HashMap<String, String>,
}
```

```rust
pub struct PlanCommandOptions {
    pub message_text: String,
}
```

## File: /home/barberb/swissknife/goose/crates/goose-cli/src/session/completion.rs

```rust
pub struct GooseCompleter {
    completion_cache: Arc<std::sync::RwLock<CompletionCache>>,
}
```

## File: /home/barberb/swissknife/goose/crates/goose-cli/src/session/mod.rs

```rust
pub struct Session {
    agent: Agent,
    messages: Vec<Message>,
    session_file: PathBuf,
    // Cache for completion data - using std::sync for thread safety without async
    completion_cache: Arc<std::sync::RwLock<CompletionCache>>,
    debug: bool, // New field for debug mode
    run_mode: RunMode,
}
```

## File: /home/barberb/swissknife/goose/crates/goose/src/permission/permission_confirmation.rs

```rust
pub struct PermissionConfirmation {
    pub principal_type: PrincipalType,
    pub permission: Permission,
}
```

## File: /home/barberb/swissknife/goose/crates/goose/src/permission/permission_judge.rs

```rust
pub struct PermissionCheckResult {
    pub approved: Vec<ToolRequest>,
    pub needs_approval: Vec<ToolRequest>,
    pub denied: Vec<ToolRequest>,
}
```

## File: /home/barberb/swissknife/goose/crates/goose/src/permission/permission_store.rs

```rust
pub struct ToolPermissionRecord {
    tool_name: String,
    allowed: bool,
    context_hash: String, // Hash of the tool's arguments/context to differentiate similar calls
    #[serde(skip_serializing_if = "Option::is_none")] // Don't serialize if None
    readable_context: Option<String>, // Add this field
    timestamp: i64,
    expiry: Option<i64>, // Optional expiry timestamp
}
```

```rust
pub struct ToolPermissionStore {
    permissions: HashMap<String, Vec<ToolPermissionRecord>>,
    version: u32, // For future schema migrations
    #[serde(skip)] // Don't serialize this field
    permissions_dir: PathBuf,
}
```

## File: /home/barberb/swissknife/goose/crates/goose/src/tracing/langfuse_layer.rs

```rust
pub struct LangfuseBatchManager {
    pub batch: Vec<Value>,
    pub client: Client,
    pub base_url: String,
    pub public_key: String,
    pub secret_key: String,
}
```

## File: /home/barberb/swissknife/goose/crates/goose/src/tracing/observation_layer.rs

```rust
pub struct SpanData {
    pub observation_id: String, // Langfuse requires ids to be UUID v4 strings
    pub name: String,
    pub start_time: String,
    pub level: String,
    pub metadata: serde_json::Map<String, Value>,
    pub parent_span_id: Option<u64>,
}
```

```rust
pub struct SpanTracker {
    active_spans: HashMap<u64, String>, // span_id -> observation_id. span_id in Tracing is u64 whereas Langfuse requires UUID v4 strings
    current_trace_id: Option<String>,
}
```

```rust
pub struct ObservationLayer {
    pub batch_manager: Arc<Mutex<dyn BatchManager>>,
    pub span_tracker: Arc<Mutex<SpanTracker>>,
}
```

## File: /home/barberb/swissknife/goose/crates/goose/src/agents/extension.rs

```rust
pub struct Envs {
    /// A map of environment variables to set, e.g. API_KEY -> some_secret, HOST -> host
    #[serde(default)]
    #[serde(flatten)]
    map: HashMap<String, String>,
}
```

```rust
pub struct ExtensionInfo {
    pub name: String,
    pub instructions: String,
    pub has_resources: bool,
}
```

```rust
pub struct ToolInfo {
    pub name: String,
    pub description: String,
    pub parameters: Vec<String>,
    pub permission: Option<PermissionLevel>,
}
```

## File: /home/barberb/swissknife/goose/crates/goose/src/agents/prompt_manager.rs

```rust
pub struct PromptManager {
    system_prompt_override: Option<String>,
    system_prompt_extras: Vec<String>,
}
```

## File: /home/barberb/swissknife/goose/crates/goose/src/agents/extension_manager.rs

```rust
pub struct ExtensionManager {
    clients: HashMap<String, McpClientBox>,
    instructions: HashMap<String, String>,
    resource_capable_extensions: HashSet<String>,
}
```

```rust
pub struct ResourceItem {
    pub client_name: String,      // The name of the client that owns the resource
    pub uri: String,              // The URI of the resource
    pub name: String,             // The name of the resource
    pub content: String,          // The content of the resource
    pub timestamp: DateTime<Utc>, // The timestamp of the resource
    pub priority: f32,            // The priority of the resource
    pub token_count: Option<u32>, // The token count of the resource (filled in by the agent)
}
```

## File: /home/barberb/swissknife/goose/crates/goose/src/agents/agent.rs

```rust
pub struct Agent {
    pub(super) provider: Arc<dyn Provider>,
    pub(super) extension_manager: Mutex<ExtensionManager>,
    pub(super) frontend_tools: HashMap<String, FrontendTool>,
    pub(super) frontend_instructions: Option<String>,
    pub(super) prompt_manager: PromptManager,
    pub(super) token_counter: TokenCounter,
    pub(super) confirmation_tx: mpsc::Sender<(String, PermissionConfirmation)>,
    pub(super) confirmation_rx: Mutex<mpsc::Receiver<(String, PermissionConfirmation)>>,
    pub(super) tool_result_tx: mpsc::Sender<(String, ToolResult<Vec<Content>>)>,
    pub(super) tool_result_rx: ToolResultReceiver,
}
```

## File: /home/barberb/swissknife/goose/crates/goose/src/agents/types.rs

```rust
pub struct FrontendTool {
    pub name: String,
    pub tool: Tool,
}
```

```rust
pub struct SessionConfig {
    /// Unique identifier for the session
    pub id: session::Identifier,
    /// Working directory for the session
    pub working_dir: PathBuf,
}
```

## File: /home/barberb/swissknife/goose/crates/goose/src/session/info.rs

```rust
pub struct SessionInfo {
    pub id: String,
    pub path: String,
    pub modified: String,
    pub metadata: SessionMetadata,
}
```

## File: /home/barberb/swissknife/goose/crates/goose/src/session/storage.rs

```rust
pub struct SessionMetadata {
    /// Working directory for the session
    pub working_dir: PathBuf,
    /// A short description of the session, typically 3 words or less
    pub description: String,
    /// Number of messages in the session
    pub message_count: usize,
    /// The total number of tokens used in the session. Retrieved from the provider's last usage.
    pub total_tokens: Option<i32>,
    /// The number of input tokens used in the session. Retrieved from the provider's last usage.
    pub input_tokens: Option<i32>,
    /// The number of output tokens used in the session. Retrieved from the provider's last usage.
    pub output_tokens: Option<i32>,
    /// The total number of tokens used in the session. Accumulated across all messages (useful for tracking cost over an entire session).
    pub accumulated_total_tokens: Option<i32>,
    /// The number of input tokens used in the session. Accumulated across all messages.
    pub accumulated_input_tokens: Option<i32>,
    /// The number of output tokens used in the session. Accumulated across all messages.
    pub accumulated_output_tokens: Option<i32>,
}
```

## File: /home/barberb/swissknife/goose/crates/goose/src/providers/azure.rs

```rust
pub struct AzureProvider {
    #[serde(skip)]
    client: Client,
    endpoint: String,
    api_key: String,
    deployment_name: String,
    api_version: String,
    model: ModelConfig,
}
```

## File: /home/barberb/swissknife/goose/crates/goose/src/providers/bedrock.rs

```rust
pub struct BedrockProvider {
    #[serde(skip)]
    client: Client,
    model: ModelConfig,
}
```

## File: /home/barberb/swissknife/goose/crates/goose/src/providers/toolshim.rs

```rust
pub struct OllamaInterpreter {
    client: Client,
    base_url: String,
}
```

## File: /home/barberb/swissknife/goose/crates/goose/src/providers/gcpvertexai.rs

```rust
pub struct GcpVertexAIProvider {
    /// HTTP client for making API requests
    #[serde(skip)]
    client: Client,
    /// GCP authentication handler
    #[serde(skip)]
    auth: GcpAuth,
    /// Base URL for the Vertex AI API
    host: String,
    /// GCP project identifier
    project_id: String,
    /// GCP region for model deployment
    location: String,
    /// Configuration for the specific model being used
    model: ModelConfig,
    /// Retry configuration for handling rate limit errors
    #[serde(skip)]
    retry_config: RetryConfig,
}
```

## File: /home/barberb/swissknife/goose/crates/goose/src/providers/gcpauth.rs

```rust
pub struct AuthToken {
    /// The type of the token (e.g., "Bearer")
    pub token_type: String,
    /// The actual token value
    pub token_value: String,
}
```

```rust
pub struct RealFilesystemOps;

/// A concrete implementation of EnvOps using the actual environment.
///
/// This implementation directly accesses system environment variables
/// through the standard library.
pub struct RealEnvOps;

#[async_trait]
impl FilesystemOps for RealFilesystemOps {
    async fn read_to_string(&self, path: String) -> Result<String, io::Error> {
        tokio::fs::read_to_string(path).await
    }
}
```

```rust
pub struct RealEnvOps;

#[async_trait]
impl FilesystemOps for RealFilesystemOps {
    async fn read_to_string(&self, path: String) -> Result<String, io::Error> {
        tokio::fs::read_to_string(path).await
    }
}
```

```rust
pub struct GcpAuth {
    /// The loaded credentials (service account or authorized user)
    credentials: AdcCredentials,
    /// HTTP client for making token exchange requests
    client: reqwest::Client,
    /// Thread-safe cache for the current token
    cached_token: Arc<RwLock<Option<CachedToken>>>,
}
```

## File: /home/barberb/swissknife/goose/crates/goose/src/providers/openrouter.rs

```rust
pub struct OpenRouterProvider {
    #[serde(skip)]
    client: Client,
    host: String,
    api_key: String,
    model: ModelConfig,
}
```

## File: /home/barberb/swissknife/goose/crates/goose/src/providers/google.rs

```rust
pub struct GoogleProvider {
    #[serde(skip)]
    client: Client,
    host: String,
    api_key: String,
    model: ModelConfig,
}
```

## File: /home/barberb/swissknife/goose/crates/goose/src/providers/databricks.rs

```rust
pub struct DatabricksProvider {
    #[serde(skip)]
    client: Client,
    host: String,
    auth: DatabricksAuth,
    model: ModelConfig,
    image_format: ImageFormat,
}
```

## File: /home/barberb/swissknife/goose/crates/goose/src/providers/groq.rs

```rust
pub struct GroqProvider {
    #[serde(skip)]
    client: Client,
    host: String,
    api_key: String,
    model: ModelConfig,
}
```

## File: /home/barberb/swissknife/goose/crates/goose/src/providers/base.rs

```rust
pub struct ProviderMetadata {
    /// The unique identifier for this provider
    pub name: String,
    /// Display name for the provider in UIs
    pub display_name: String,
    /// Description of the provider's capabilities
    pub description: String,
    /// The default/recommended model for this provider
    pub default_model: String,
    /// A list of currently known models
    /// TODO: eventually query the apis directly
    pub known_models: Vec<String>,
    /// Link to the docs where models can be found
    pub model_doc_link: String,
    /// Required configuration keys
    pub config_keys: Vec<ConfigKey>,
}
```

```rust
pub struct ConfigKey {
    pub name: String,
    pub required: bool,
    pub secret: bool,
    pub default: Option<String>,
}
```

```rust
pub struct ProviderUsage {
    pub model: String,
    pub usage: Usage,
}
```

```rust
pub struct Usage {
    pub input_tokens: Option<i32>,
    pub output_tokens: Option<i32>,
    pub total_tokens: Option<i32>,
}
```

## File: /home/barberb/swissknife/goose/crates/goose/src/providers/formats/gcpvertexai.rs

```rust
pub struct RequestContext {
    /// The GCP Vertex AI model being used
    pub model: GcpVertexAIModel,
}
```

## File: /home/barberb/swissknife/goose/crates/goose/src/providers/errors.rs

```rust
pub struct OpenAIError {
    pub code: Option<String>,
    pub message: Option<String>,
    #[serde(rename = "type")]
    pub error_type: Option<String>,
}
```

## File: /home/barberb/swissknife/goose/crates/goose/src/providers/ollama.rs

```rust
pub struct OllamaProvider {
    #[serde(skip)]
    client: Client,
    host: String,
    model: ModelConfig,
}
```

## File: /home/barberb/swissknife/goose/crates/goose/src/providers/anthropic.rs

```rust
pub struct AnthropicProvider {
    #[serde(skip)]
    client: Client,
    host: String,
    api_key: String,
    model: ModelConfig,
}
```

## File: /home/barberb/swissknife/goose/crates/goose/src/providers/openai.rs

```rust
pub struct OpenAiProvider {
    #[serde(skip)]
    client: Client,
    host: String,
    base_path: String,
    api_key: String,
    organization: Option<String>,
    project: Option<String>,
    model: ModelConfig,
    custom_headers: Option<HashMap<String, String>>,
}
```

## File: /home/barberb/swissknife/goose/crates/goose/src/message.rs

```rust
pub struct ToolRequest {
    pub id: String,
    #[serde(with = "tool_result_serde")]
    pub tool_call: ToolResult<ToolCall>,
}
```

```rust
pub struct ToolResponse {
    pub id: String,
    #[serde(with = "tool_result_serde")]
    pub tool_result: ToolResult<Vec<Content>>,
}
```

```rust
pub struct ToolConfirmationRequest {
    pub id: String,
    pub tool_name: String,
    pub arguments: Value,
    pub prompt: Option<String>,
}
```

```rust
pub struct EnableExtensionRequest {
    pub id: String,
    pub extension_name: String,
}
```

```rust
pub struct ThinkingContent {
    pub thinking: String,
    pub signature: String,
}
```

```rust
pub struct RedactedThinkingContent {
    pub data: String,
}
```

```rust
pub struct FrontendToolRequest {
    pub id: String,
    #[serde(with = "tool_result_serde")]
    pub tool_call: ToolResult<ToolCall>,
}
```

```rust
pub struct Message {
    pub role: Role,
    pub created: i64,
    pub content: Vec<MessageContent>,
}
```

## File: /home/barberb/swissknife/goose/crates/goose/src/recipe/mod.rs

```rust
pub struct Recipe {
    // Required fields
    #[serde(default = "default_version")]
    pub version: String, // version of the file format, sem ver

    pub title: String, // short title of the recipe

    pub description: String, // a longer description of the recipe

    pub instructions: String, // the instructions for the model

    // Optional fields
    #[serde(skip_serializing_if = "Option::is_none")]
    pub prompt: Option<String>, // the prompt to start the session with

    #[serde(skip_serializing_if = "Option::is_none")]
    pub extensions: Option<Vec<ExtensionConfig>>, // a list of extensions to enable

    #[serde(skip_serializing_if = "Option::is_none")]
    pub context: Option<Vec<String>>, // any additional context

    #[serde(skip_serializing_if = "Option::is_none")]
    pub activities: Option<Vec<String>>, // the activity pills that show up when loading the

    #[serde(skip_serializing_if = "Option::is_none")]
    pub author: Option<Author>, // any additional author information
}
```

```rust
pub struct Author {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub contact: Option<String>, // creator/contact information of the recipe

    #[serde(skip_serializing_if = "Option::is_none")]
    pub metadata: Option<String>, // any additional metadata for the author
}
```

```rust
pub struct RecipeBuilder {
    // Required fields with default values
    version: String,
    title: Option<String>,
    description: Option<String>,
    instructions: Option<String>,

    // Optional fields
    prompt: Option<String>,
    extensions: Option<Vec<ExtensionConfig>>,
    context: Option<Vec<String>>,
    activities: Option<Vec<String>>,
    author: Option<Author>,
}
```

## File: /home/barberb/swissknife/goose/crates/goose/src/truncate.rs

```rust
pub struct OldestFirstTruncation;
/// Strategy to truncate messages explicitly
pub struct ExplicitTruncation;

impl TruncationStrategy for OldestFirstTruncation {
    fn determine_indices_to_remove(
        &self,
        messages: &[Message],
        token_counts: &[usize],
        context_limit: usize,
    ) -> Result<HashSet<usize>> {
        let mut indices_to_remove = HashSet::new();
        let mut total_tokens: usize = token_counts.iter().sum();
        let mut tool_ids_to_remove = HashSet::new();

        for (i, message) in messages.iter().enumerate() {
            if total_tokens <= context_limit {
                break;
            }

            // Remove the message
            indices_to_remove.insert(i);
            total_tokens -= token_counts[i];
            debug!(
                "OldestFirst: Removing message at index {}. Tokens removed: {}",
                i, token_counts[i]
            );

            // If it's a ToolRequest or ToolResponse, mark its pair for removal
            if message.is_tool_call() || message.is_tool_response() {
                message.get_tool_ids().iter().for_each(|id| {
                    tool_ids_to_remove.insert((i, id.to_string()));
                });
            }
        }

        // Now, find and remove paired ToolResponses or ToolRequests
        for (i, message) in messages.iter().enumerate() {
            let message_tool_ids = message.get_tool_ids();
            // Find the other part of the pair - same tool_id but different message index
            for (message_idx, tool_id) in &tool_ids_to_remove {
                if message_idx != &i && message_tool_ids.contains(tool_id.as_str()) {
                    indices_to_remove.insert(i);
                    // No need to check other tool_ids for this message since it's already marked
                    break;
                }
            }
        }

        Ok(indices_to_remove)
    }
}
```

```rust
pub struct ExplicitTruncation;

impl TruncationStrategy for OldestFirstTruncation {
    fn determine_indices_to_remove(
        &self,
        messages: &[Message],
        token_counts: &[usize],
        context_limit: usize,
    ) -> Result<HashSet<usize>> {
        let mut indices_to_remove = HashSet::new();
        let mut total_tokens: usize = token_counts.iter().sum();
        let mut tool_ids_to_remove = HashSet::new();

        for (i, message) in messages.iter().enumerate() {
            if total_tokens <= context_limit {
                break;
            }

            // Remove the message
            indices_to_remove.insert(i);
            total_tokens -= token_counts[i];
            debug!(
                "OldestFirst: Removing message at index {}. Tokens removed: {}",
                i, token_counts[i]
            );

            // If it's a ToolRequest or ToolResponse, mark its pair for removal
            if message.is_tool_call() || message.is_tool_response() {
                message.get_tool_ids().iter().for_each(|id| {
                    tool_ids_to_remove.insert((i, id.to_string()));
                });
            }
        }

        // Now, find and remove paired ToolResponses or ToolRequests
        for (i, message) in messages.iter().enumerate() {
            let message_tool_ids = message.get_tool_ids();
            // Find the other part of the pair - same tool_id but different message index
            for (message_idx, tool_id) in &tool_ids_to_remove {
                if message_idx != &i && message_tool_ids.contains(tool_id.as_str()) {
                    indices_to_remove.insert(i);
                    // No need to check other tool_ids for this message since it's already marked
                    break;
                }
            }
        }

        Ok(indices_to_remove)
    }
}
```

## File: /home/barberb/swissknife/goose/crates/goose/src/config/extensions.rs

```rust
pub struct ExtensionEntry {
    pub enabled: bool,
    #[serde(flatten)]
    pub config: ExtensionConfig,
}
```

```rust
pub struct ExtensionConfigManager;

impl ExtensionConfigManager {
    /// Get the extension configuration if enabled -- uses key
    pub fn get_config(key: &str) -> Result<Option<ExtensionConfig>> {
        let config = Config::global();

        // Try to get the extension entry
        let extensions: HashMap<String, ExtensionEntry> = match config.get_param("extensions") {
            Ok(exts) => exts,
            Err(super::ConfigError::NotFound(_)) => {
                // Initialize with default developer extension
                let defaults = HashMap::from([(
                    name_to_key(DEFAULT_EXTENSION), // Use key format for top-level key in config
                    ExtensionEntry {
                        enabled: true,
                        config: ExtensionConfig::Builtin {
                            name: DEFAULT_EXTENSION.to_string(),
                            display_name: Some(DEFAULT_DISPLAY_NAME.to_string()),
                            timeout: Some(DEFAULT_EXTENSION_TIMEOUT),
                            bundled: Some(true),
                        },
                    },
                )]);
                config.set_param("extensions", serde_json::to_value(&defaults)?)?;
                defaults
            }
            Err(e) => return Err(e.into()),
        };

        Ok(extensions.get(key).and_then(|entry| {
            if entry.enabled {
                Some(entry.config.clone())
            } else {
                None
            }
        }))
    }

    pub fn get_config_by_name(name: &str) -> Result<Option<ExtensionConfig>> {
        let config = Config::global();

        // Try to get the extension entry
        let extensions: HashMap<String, ExtensionEntry> = match config.get_param("extensions") {
            Ok(exts) => exts,
            Err(super::ConfigError::NotFound(_)) => HashMap::new(),
            Err(_) => HashMap::new(),
        };

        Ok(extensions
            .values()
            .find(|entry| entry.config.name() == name)
            .map(|entry| entry.config.clone()))
    }

    /// Set or update an extension configuration
    pub fn set(entry: ExtensionEntry) -> Result<()> {
        let config = Config::global();

        let mut extensions: HashMap<String, ExtensionEntry> = config
            .get_param("extensions")
            .unwrap_or_else(|_| HashMap::new());

        let key = entry.config.key();

        extensions.insert(key, entry);
        config.set_param("extensions", serde_json::to_value(extensions)?)?;
        Ok(())
    }

    /// Remove an extension configuration -- uses the key
    pub fn remove(key: &str) -> Result<()> {
        let config = Config::global();

        let mut extensions: HashMap<String, ExtensionEntry> = config
            .get_param("extensions")
            .unwrap_or_else(|_| HashMap::new());

        extensions.remove(key);
        config.set_param("extensions", serde_json::to_value(extensions)?)?;
        Ok(())
    }

    /// Enable or disable an extension -- uses key
    pub fn set_enabled(key: &str, enabled: bool) -> Result<()> {
        let config = Config::global();

        let mut extensions: HashMap<String, ExtensionEntry> = config
            .get_param("extensions")
            .unwrap_or_else(|_| HashMap::new());

        if let Some(entry) = extensions.get_mut(key) {
            entry.enabled = enabled;
            config.set_param("extensions", serde_json::to_value(extensions)?)?;
        }
        Ok(())
    }

    /// Get all extensions and their configurations
    pub fn get_all() -> Result<Vec<ExtensionEntry>> {
        let config = Config::global();
        let extensions: HashMap<String, ExtensionEntry> = config
            .get_param("extensions")
            .unwrap_or_else(|_| HashMap::new());
        Ok(Vec::from_iter(extensions.values().cloned()))
    }

    /// Get all extension names
    pub fn get_all_names() -> Result<Vec<String>> {
        let config = Config::global();
        Ok(config
            .get_param("extensions")
            .unwrap_or_else(|_| get_keys(Default::default())))
    }

    /// Check if an extension is enabled - FIXED to use key
    pub fn is_enabled(key: &str) -> Result<bool> {
        let config = Config::global();
        let extensions: HashMap<String, ExtensionEntry> = config
            .get_param("extensions")
            .unwrap_or_else(|_| HashMap::new());

        Ok(extensions.get(key).map(|e| e.enabled).unwrap_or(false))
    }
}
```

## File: /home/barberb/swissknife/goose/crates/goose/src/config/base.rs

```rust
pub struct Config {
    config_path: PathBuf,
    secrets: SecretStorage,
}
```

## File: /home/barberb/swissknife/goose/crates/goose/src/config/experiments.rs

```rust
pub struct ExperimentManager;

impl ExperimentManager {
    /// Get all experiments and their configurations
    ///
    /// - Ensures the user's experiment list is synchronized with `ALL_EXPERIMENTS`.
    /// - Adds missing experiments from `ALL_EXPERIMENTS` with the default value.
    /// - Removes experiments not in `ALL_EXPERIMENTS`.
    pub fn get_all() -> Result<Vec<(String, bool)>> {
        let config = Config::global();
        let mut experiments: HashMap<String, bool> =
            config.get_param("experiments").unwrap_or_default();
        Self::refresh_experiments(&mut experiments);

        Ok(experiments.into_iter().collect())
    }

    /// Enable or disable an experiment
    pub fn set_enabled(name: &str, enabled: bool) -> Result<()> {
        let config = Config::global();
        let mut experiments: HashMap<String, bool> = config
            .get_param("experiments")
            .unwrap_or_else(|_| HashMap::new());
        Self::refresh_experiments(&mut experiments);
        experiments.insert(name.to_string(), enabled);

        config.set_param("experiments", serde_json::to_value(experiments)?)?;
        Ok(())
    }

    /// Check if an experiment is enabled
    pub fn is_enabled(name: &str) -> Result<bool> {
        let experiments = Self::get_all()?;
        let experiments_map: HashMap<String, bool> = experiments.into_iter().collect();
        Ok(*experiments_map.get(name).unwrap_or(&false))
    }

    fn refresh_experiments(experiments: &mut HashMap<String, bool>) {
        // Add missing experiments from `ALL_EXPERIMENTS`
        for &(key, default_value) in ALL_EXPERIMENTS {
            experiments.entry(key.to_string()).or_insert(default_value);
        }

        // Remove experiments not present in `ALL_EXPERIMENTS`
        experiments.retain(|key, _| ALL_EXPERIMENTS.iter().any(|(k, _)| k == key));
    }
}
```

## File: /home/barberb/swissknife/goose/crates/goose/src/config/permission.rs

```rust
pub struct PermissionConfig {
    pub always_allow: Vec<String>, // List of tools that are always allowed
    pub ask_before: Vec<String>,   // List of tools that require user consent
    pub never_allow: Vec<String>,  // List of tools that are never allowed
}
```

```rust
pub struct PermissionManager {
    config_path: PathBuf, // Path to the permission configuration file
    permission_map: HashMap<String, PermissionConfig>, // Mapping of permission names to configurations
}
```

## File: /home/barberb/swissknife/goose/crates/goose/src/model.rs

```rust
pub struct ModelConfig {
    /// The name of the model to use
    pub model_name: String,
    // Optional tokenizer name (corresponds to the sanitized HuggingFace tokenizer name)
    // "Xenova/gpt-4o" -> "Xenova/gpt-4o"
    // If not provided, best attempt will be made to infer from model name or default
    pub tokenizer_name: String,
    /// Optional explicit context limit that overrides any defaults
    pub context_limit: Option<usize>,
    /// Optional temperature setting (0.0 - 1.0)
    pub temperature: Option<f32>,
    /// Optional maximum tokens to generate
    pub max_tokens: Option<i32>,
    /// Whether to interpret tool calls with toolshim
    pub toolshim: bool,
    /// Model to use for toolshim (optional as a default exists)
    pub toolshim_model: Option<String>,
}
```

## File: /home/barberb/swissknife/goose/crates/goose/src/token_counter.rs

```rust
pub struct TokenCounter {
    tokenizer: Tokenizer,
}
```

## File: /home/barberb/swissknife/goose/crates/goose-server/src/routes/configs.rs

```rust
pub struct ProviderConfigRequest {
    pub providers: Vec<String>,
}
```

```rust
pub struct ConfigStatus {
    pub is_set: bool,
    pub location: Option<String>,
}
```

```rust
pub struct ProviderResponse {
    pub supported: bool,
    pub name: Option<String>,
    pub description: Option<String>,
    pub models: Option<Vec<String>>,
    pub config_status: HashMap<String, ConfigStatus>,
}
```

```rust
pub struct GetConfigQuery {
    key: String,
}
```

```rust
pub struct GetConfigResponse {
    value: Option<String>,
}
```

## File: /home/barberb/swissknife/goose/crates/goose-server/src/routes/agent.rs

```rust
pub struct GetToolsQuery {
    extension_name: Option<String>,
}
```

## File: /home/barberb/swissknife/goose/crates/goose-server/src/routes/reply.rs

```rust
pub struct SseResponse {
    rx: ReceiverStream<String>,
}
```

```rust
pub struct PermissionConfirmationRequest {
    id: String,
    #[serde(default = "default_principal_type")]
    principal_type: PrincipalType,
    action: String,
}
```

## File: /home/barberb/swissknife/goose/crates/goose-server/src/routes/recipe.rs

```rust
pub struct CreateRecipeRequest {
    messages: Vec<Message>,
    // Required metadata
    title: String,
    description: String,
    // Optional fields
    #[serde(default)]
    activities: Option<Vec<String>>,
    #[serde(default)]
    author: Option<AuthorRequest>,
}
```

```rust
pub struct AuthorRequest {
    #[serde(default)]
    contact: Option<String>,
    #[serde(default)]
    metadata: Option<String>,
}
```

```rust
pub struct CreateRecipeResponse {
    recipe: Option<Recipe>,
    error: Option<String>,
}
```

## File: /home/barberb/swissknife/goose/crates/goose-server/src/routes/utils.rs

```rust
pub struct KeyInfo {
    pub name: String,
    pub is_set: bool,
    pub location: KeyLocation,
    pub is_secret: bool,
    pub value: Option<String>, // Only populated for non-secret keys that are set
}
```

## File: /home/barberb/swissknife/goose/crates/goose-server/src/routes/config_management.rs

```rust
pub struct ExtensionResponse {
    pub extensions: Vec<ExtensionEntry>,
}
```

```rust
pub struct ExtensionQuery {
    pub name: String,
    pub config: ExtensionConfig,
    pub enabled: bool,
}
```

```rust
pub struct UpsertConfigQuery {
    pub key: String,
    pub value: Value,
    pub is_secret: bool,
}
```

```rust
pub struct ConfigKeyQuery {
    pub key: String,
    pub is_secret: bool,
}
```

```rust
pub struct ConfigResponse {
    pub config: HashMap<String, Value>,
}
```

```rust
pub struct ProviderDetails {
    /// Unique identifier and name of the provider
    pub name: String,
    /// Metadata about the provider
    pub metadata: ProviderMetadata,
    /// Indicates whether the provider is fully configured
    pub is_configured: bool,
}
```

```rust
pub struct ProvidersResponse {
    pub providers: Vec<ProviderDetails>,
}
```

```rust
pub struct ToolPermission {
    /// Unique identifier and name of the tool, format <extension_name>__<tool_name>
    pub tool_name: String,
    pub permission: PermissionLevel,
}
```

```rust
pub struct UpsertPermissionsQuery {
    pub tool_permissions: Vec<ToolPermission>,
}
```

## File: /home/barberb/swissknife/goose/crates/goose-server/src/openapi.rs

```rust
pub struct ApiDoc;

#[allow(dead_code)] // Used by generate_schema binary
pub fn generate_schema() -> String {
    let api_doc = ApiDoc::openapi();
    serde_json::to_string_pretty(&api_doc).unwrap()
}
```

## File: /home/barberb/swissknife/goose/crates/goose-server/src/state.rs

```rust
pub struct AppState {
    pub agent: Arc<RwLock<Option<Agent>>>,
    pub secret_key: String,
    pub config: Arc<Mutex<HashMap<String, Value>>>,
}
```

## File: /home/barberb/swissknife/goose/crates/goose-server/src/configuration.rs

```rust
pub struct Settings {
    #[serde(default = "default_host")]
    pub host: String,
    #[serde(default = "default_port")]
    pub port: u16,
}
```


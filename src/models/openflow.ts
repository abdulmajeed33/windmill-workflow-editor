/**
 * OpenFlow Type Definitions
 * 
 * Complete TypeScript implementation of the OpenFlow specification.
 * See: https://docs.windmill.dev/docs/openflow
 */

// ============================================================================
// Core Types
// ============================================================================

export interface OpenFlow {
  summary?: string;
  description?: string;
  value: FlowValue;
  schema?: Record<string, unknown>;
}

export interface FlowValue {
  modules: FlowModule[];
  failure_module?: FlowModule;
  same_worker: boolean;
}

// ============================================================================
// Flow Module
// ============================================================================

export interface FlowModule {
  id: string; // Added for React Flow compatibility
  value: ModuleValue;
  summary?: string;
  stop_after_if?: StopAfterIf;
  sleep?: InputTransform;
  suspend?: Suspend;
  retry?: Retry;
}

export type ModuleValue =
  | Identity
  | RawScript
  | PathScript
  | ForloopFlow
  | BranchOne
  | BranchAll;

// ============================================================================
// Module Types (Discriminated Union)
// ============================================================================

export interface Identity {
  type: 'identity';
}

export interface RawScript {
  type: 'rawscript';
  content: string;
  language: 'deno' | 'python3' | 'go' | 'bash' | 'postgresql' | 'mysql' | 'bigquery' | 'snowflake' | 'mssql' | 'graphql' | 'nativets';
  path?: string;
  input_transforms: Record<string, InputTransform>;
  lock?: string;
  tag?: string;
}

export interface PathScript {
  type: 'script';
  path: string;
  input_transforms: Record<string, InputTransform>;
  hash?: string;
  tag?: string;
}

export interface ForloopFlow {
  type: 'forloopflow';
  modules: FlowModule[];
  iterator: InputTransform;
  skip_failures?: boolean;
  parallel?: boolean;
  parallelism?: number;
}

export interface BranchOne {
  type: 'branchone';
  branches: Branch[];
  default: FlowModule[];
}

export interface BranchAll {
  type: 'branchall';
  branches: BranchAllBranch[];
  default: FlowModule[];
  parallel?: boolean;
}

// ============================================================================
// Supporting Types
// ============================================================================

export type InputTransform = StaticTransform | JavascriptTransform;

export interface StaticTransform {
  type: 'static';
  value: unknown;
}

export interface JavascriptTransform {
  type: 'javascript';
  expr: string;
}

export interface Branch {
  summary?: string;
  expr: string;
  modules: FlowModule[];
}

export interface BranchAllBranch {
  summary?: string;
  skip_failure: boolean;
  modules: FlowModule[];
}

export interface StopAfterIf {
  expr: string;
  skip_if_stopped: boolean;
  suspend?: number;
}

export interface Suspend {
  required_events?: number;
  timeout: number;
  resume_form?: Record<string, unknown>;
}

export interface Retry {
  constant?: RetryConstant;
  exponential?: RetryExponential;
}

export interface RetryConstant {
  attempts: number;
  seconds: number;
}

export interface RetryExponential {
  attempts: number;
  multiplier: number;
  seconds: number;
}

// ============================================================================
// Type Guards
// ============================================================================

export function isIdentity(value: ModuleValue): value is Identity {
  return value.type === 'identity';
}

export function isRawScript(value: ModuleValue): value is RawScript {
  return value.type === 'rawscript';
}

export function isPathScript(value: ModuleValue): value is PathScript {
  return value.type === 'script';
}

export function isForloopFlow(value: ModuleValue): value is ForloopFlow {
  return value.type === 'forloopflow';
}

export function isBranchOne(value: ModuleValue): value is BranchOne {
  return value.type === 'branchone';
}

export function isBranchAll(value: ModuleValue): value is BranchAll {
  return value.type === 'branchall';
}

export function isStaticTransform(transform: InputTransform): transform is StaticTransform {
  return transform.type === 'static';
}

export function isJavascriptTransform(transform: InputTransform): transform is JavascriptTransform {
  return transform.type === 'javascript';
}

// ============================================================================
// JSON Serialization
// ============================================================================

/**
 * Convert OpenFlow JSON to typed OpenFlow object
 * Handles missing fields with safe defaults
 */
export function fromJson(json: unknown): OpenFlow {
  if (!json || typeof json !== 'object') {
    throw new Error('Invalid OpenFlow JSON: expected object');
  }

  const obj = json as Record<string, unknown>;

  // Parse FlowValue
  const valueJson = obj.value;
  if (!valueJson || typeof valueJson !== 'object') {
    throw new Error('Invalid OpenFlow JSON: missing or invalid value field');
  }

  const value = parseFlowValue(valueJson as Record<string, unknown>);

  return {
    summary: typeof obj.summary === 'string' ? obj.summary : undefined,
    description: typeof obj.description === 'string' ? obj.description : undefined,
    value,
    schema: typeof obj.schema === 'object' ? (obj.schema as Record<string, unknown>) : undefined,
  };
}

/**
 * Convert typed OpenFlow object to JSON
 * Preserves all metadata and unknown fields
 */
export function toJson(flow: OpenFlow): Record<string, unknown> {
  return {
    ...(flow.summary && { summary: flow.summary }),
    ...(flow.description && { description: flow.description }),
    value: flowValueToJson(flow.value),
    ...(flow.schema && { schema: flow.schema }),
  };
}

// ============================================================================
// Internal Parsing Helpers
// ============================================================================

function parseFlowValue(json: Record<string, unknown>): FlowValue {
  const modules = Array.isArray(json.modules)
    ? json.modules.map((m, idx) => parseFlowModule(m, idx))
    : [];

  const failure_module = json.failure_module
    ? parseFlowModule(json.failure_module, -1)
    : undefined;

  return {
    modules,
    failure_module,
    same_worker: typeof json.same_worker === 'boolean' ? json.same_worker : false,
  };
}

function parseFlowModule(json: unknown, index: number): FlowModule {
  if (!json || typeof json !== 'object') {
    throw new Error(`Invalid FlowModule at index ${index}`);
  }

  const obj = json as Record<string, unknown>;

  // Generate ID if not present
  const id = typeof obj.id === 'string' ? obj.id : `module_${Date.now()}_${index}`;

  // Parse module value
  const value = parseModuleValue(obj.value);

  return {
    id,
    value,
    summary: typeof obj.summary === 'string' ? obj.summary : undefined,
    stop_after_if: obj.stop_after_if ? parseStopAfterIf(obj.stop_after_if) : undefined,
    sleep: obj.sleep ? parseInputTransform(obj.sleep) : undefined,
    suspend: obj.suspend ? parseSuspend(obj.suspend) : undefined,
    retry: obj.retry ? parseRetry(obj.retry) : undefined,
  };
}

function parseModuleValue(json: unknown): ModuleValue {
  if (!json || typeof json !== 'object') {
    throw new Error('Invalid ModuleValue: expected object');
  }

  const obj = json as Record<string, unknown>;
  const type = obj.type as string;

  switch (type) {
    case 'identity':
      return { type: 'identity' };

    case 'rawscript':
      return {
        type: 'rawscript',
        content: typeof obj.content === 'string' ? obj.content : '',
        language: (obj.language as RawScript['language']) || 'deno',
        path: typeof obj.path === 'string' ? obj.path : undefined,
        input_transforms: parseInputTransforms(obj.input_transforms),
        lock: typeof obj.lock === 'string' ? obj.lock : undefined,
        tag: typeof obj.tag === 'string' ? obj.tag : undefined,
      };

    case 'script':
      return {
        type: 'script',
        path: typeof obj.path === 'string' ? obj.path : '',
        input_transforms: parseInputTransforms(obj.input_transforms),
        hash: typeof obj.hash === 'string' ? obj.hash : undefined,
        tag: typeof obj.tag === 'string' ? obj.tag : undefined,
      };

    case 'forloopflow':
      return {
        type: 'forloopflow',
        modules: Array.isArray(obj.modules)
          ? obj.modules.map((m, idx) => parseFlowModule(m, idx))
          : [],
        iterator: parseInputTransform(obj.iterator),
        skip_failures: typeof obj.skip_failures === 'boolean' ? obj.skip_failures : false,
        parallel: typeof obj.parallel === 'boolean' ? obj.parallel : undefined,
        parallelism: typeof obj.parallelism === 'number' ? obj.parallelism : undefined,
      };

    case 'branchone':
      return {
        type: 'branchone',
        branches: Array.isArray(obj.branches)
          ? obj.branches.map(parseBranch)
          : [],
        default: Array.isArray(obj.default)
          ? obj.default.map((m, idx) => parseFlowModule(m, idx))
          : [],
      };

    case 'branchall':
      return {
        type: 'branchall',
        branches: Array.isArray(obj.branches)
          ? obj.branches.map(parseBranchAll)
          : [],
        default: Array.isArray(obj.default)
          ? obj.default.map((m, idx) => parseFlowModule(m, idx))
          : [],
        parallel: typeof obj.parallel === 'boolean' ? obj.parallel : undefined,
      };

    default:
      throw new Error(`Unknown module type: ${type}`);
  }
}

function parseInputTransforms(json: unknown): Record<string, InputTransform> {
  if (!json || typeof json !== 'object') {
    return {};
  }

  const obj = json as Record<string, unknown>;
  const result: Record<string, InputTransform> = {};

  for (const [key, value] of Object.entries(obj)) {
    result[key] = parseInputTransform(value);
  }

  return result;
}

function parseInputTransform(json: unknown): InputTransform {
  if (!json || typeof json !== 'object') {
    return { type: 'static', value: json };
  }

  const obj = json as Record<string, unknown>;

  if (obj.type === 'javascript' && typeof obj.expr === 'string') {
    return { type: 'javascript', expr: obj.expr };
  }

  return { type: 'static', value: obj.value };
}

function parseBranch(json: unknown): Branch {
  const obj = json as Record<string, unknown>;
  return {
    summary: typeof obj.summary === 'string' ? obj.summary : undefined,
    expr: typeof obj.expr === 'string' ? obj.expr : '',
    modules: Array.isArray(obj.modules)
      ? obj.modules.map((m, idx) => parseFlowModule(m, idx))
      : [],
  };
}

function parseBranchAll(json: unknown): BranchAllBranch {
  const obj = json as Record<string, unknown>;
  return {
    summary: typeof obj.summary === 'string' ? obj.summary : undefined,
    skip_failure: typeof obj.skip_failure === 'boolean' ? obj.skip_failure : false,
    modules: Array.isArray(obj.modules)
      ? obj.modules.map((m, idx) => parseFlowModule(m, idx))
      : [],
  };
}

function parseStopAfterIf(json: unknown): StopAfterIf {
  const obj = json as Record<string, unknown>;
  return {
    expr: typeof obj.expr === 'string' ? obj.expr : '',
    skip_if_stopped: typeof obj.skip_if_stopped === 'boolean' ? obj.skip_if_stopped : false,
    suspend: typeof obj.suspend === 'number' ? obj.suspend : undefined,
  };
}

function parseSuspend(json: unknown): Suspend {
  const obj = json as Record<string, unknown>;
  return {
    required_events: typeof obj.required_events === 'number' ? obj.required_events : undefined,
    timeout: typeof obj.timeout === 'number' ? obj.timeout : 0,
    resume_form: typeof obj.resume_form === 'object' ? (obj.resume_form as Record<string, unknown>) : undefined,
  };
}

function parseRetry(json: unknown): Retry {
  const obj = json as Record<string, unknown>;
  const result: Retry = {};

  if (obj.constant && typeof obj.constant === 'object') {
    const constant = obj.constant as Record<string, unknown>;
    result.constant = {
      attempts: typeof constant.attempts === 'number' ? constant.attempts : 3,
      seconds: typeof constant.seconds === 'number' ? constant.seconds : 10,
    };
  }

  if (obj.exponential && typeof obj.exponential === 'object') {
    const exponential = obj.exponential as Record<string, unknown>;
    result.exponential = {
      attempts: typeof exponential.attempts === 'number' ? exponential.attempts : 3,
      multiplier: typeof exponential.multiplier === 'number' ? exponential.multiplier : 2,
      seconds: typeof exponential.seconds === 'number' ? exponential.seconds : 10,
    };
  }

  return result;
}

// ============================================================================
// JSON Serialization Helpers
// ============================================================================

function flowValueToJson(value: FlowValue): Record<string, unknown> {
  return {
    modules: value.modules.map(moduleToJson),
    ...(value.failure_module && { failure_module: moduleToJson(value.failure_module) }),
    same_worker: value.same_worker,
  };
}

function moduleToJson(module: FlowModule): Record<string, unknown> {
  return {
    id: module.id,
    value: moduleValueToJson(module.value),
    ...(module.summary && { summary: module.summary }),
    ...(module.stop_after_if && { stop_after_if: module.stop_after_if }),
    ...(module.sleep && { sleep: inputTransformToJson(module.sleep) }),
    ...(module.suspend && { suspend: module.suspend }),
    ...(module.retry && { retry: module.retry }),
  };
}

function moduleValueToJson(value: ModuleValue): Record<string, unknown> {
  switch (value.type) {
    case 'identity':
      return { type: 'identity' };

    case 'rawscript':
      return {
        type: 'rawscript',
        content: value.content,
        language: value.language,
        ...(value.path && { path: value.path }),
        input_transforms: inputTransformsToJson(value.input_transforms),
        ...(value.lock && { lock: value.lock }),
        ...(value.tag && { tag: value.tag }),
      };

    case 'script':
      return {
        type: 'script',
        path: value.path,
        input_transforms: inputTransformsToJson(value.input_transforms),
        ...(value.hash && { hash: value.hash }),
        ...(value.tag && { tag: value.tag }),
      };

    case 'forloopflow':
      return {
        type: 'forloopflow',
        modules: value.modules.map(moduleToJson),
        iterator: inputTransformToJson(value.iterator),
        ...(value.skip_failures !== undefined && { skip_failures: value.skip_failures }),
        ...(value.parallel !== undefined && { parallel: value.parallel }),
        ...(value.parallelism !== undefined && { parallelism: value.parallelism }),
      };

    case 'branchone':
      return {
        type: 'branchone',
        branches: value.branches.map(b => ({
          ...(b.summary && { summary: b.summary }),
          expr: b.expr,
          modules: b.modules.map(moduleToJson),
        })),
        default: value.default.map(moduleToJson),
      };

    case 'branchall':
      return {
        type: 'branchall',
        branches: value.branches.map(b => ({
          ...(b.summary && { summary: b.summary }),
          skip_failure: b.skip_failure,
          modules: b.modules.map(moduleToJson),
        })),
        default: value.default.map(moduleToJson),
        ...(value.parallel !== undefined && { parallel: value.parallel }),
      };

    default:
      // Exhaustive check
      const _exhaustive: never = value;
      throw new Error(`Unknown module type: ${(_exhaustive as ModuleValue).type}`);
  }
}

function inputTransformsToJson(transforms: Record<string, InputTransform>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, transform] of Object.entries(transforms)) {
    result[key] = inputTransformToJson(transform);
  }
  return result;
}

function inputTransformToJson(transform: InputTransform): Record<string, unknown> {
  if (transform.type === 'javascript') {
    return { type: 'javascript', expr: transform.expr };
  }
  return { type: 'static', value: transform.value };
}

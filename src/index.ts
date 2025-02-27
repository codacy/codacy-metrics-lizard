import { run } from "codacy-seed"
// run from codacy-seed aka codacy-egine-typescript-seed is working for tool results, but not for metrics
// a new class must be implemented in order to run and manage metrics results, either here, or in the seed
// that is managing MetricsResults the same way ToolResults are managed
import { lizardMetricsEngine } from "./lizardMetricsEngine"

run(lizardMetricsEngine())

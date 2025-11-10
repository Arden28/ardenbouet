declare module "markdown-it-task-lists" {
  import { PluginWithOptions } from "markdown-it";

  interface TaskListOptions {
    enabled?: boolean;
    label?: boolean;
    labelAfter?: boolean;
  }

  const taskLists: PluginWithOptions<TaskListOptions>;
  export default taskLists;
}

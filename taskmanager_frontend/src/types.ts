export type TodoStatus = "offen" | "in Bearbeitung" | "erledigt";

export interface Todo {
  id: number;
  title: string;
  description?: string;
  status: TodoStatus;
  created_at?: string;
}

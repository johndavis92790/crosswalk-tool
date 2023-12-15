import { CFItemsTable } from "../components/CFItemsTable";
import { JsonUpload } from "../components/JsonUpload";

export function Homepage() {
  return (
    <div>
      <JsonUpload />
      <CFItemsTable />
    </div>
  );
}

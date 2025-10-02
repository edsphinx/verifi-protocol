import { execSync } from "child_process";
import { namedAddress, packageDir, stdio } from "../_config";

function test() {
  console.log("🧪 Testing Move contracts...");
  try {
    execSync(
      `aptos move test --package-dir ${packageDir} --named-addresses ${namedAddress}`,
      stdio,
    );
    console.log(" Move tests passed successfully.");
  } catch (error) {
    console.error(" Error running Move tests.");
    process.exit(1);
  }
}

test();

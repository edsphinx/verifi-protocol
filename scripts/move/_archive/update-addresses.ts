/**
 * Update Addresses Script
 *
 * Updates all Move.toml files with the current publisher address
 * This ensures Tapp and hooks can reference the deployed VeriFi contract
 */

import fs from "fs";
import path from "path";
import dotenv from "dotenv";

const projectRoot = path.resolve(__dirname, "..", "..");

// Load environment variables
const envPath = path.resolve(projectRoot, ".env");
dotenv.config({ path: envPath });

const publisherAddress = process.env.NEXT_PUBLIC_PUBLISHER_ACCOUNT_ADDRESS;

if (!publisherAddress) {
  console.error(" Error: NEXT_PUBLIC_PUBLISHER_ACCOUNT_ADDRESS not set");
  process.exit(1);
}

console.log("🔄 Updating addresses in Move.toml files...");
console.log(`📍 Publisher Address: ${publisherAddress}\n`);

// Determine if we're in deployment mode (default) or test mode
const isTestMode = process.env.MOVE_BUILD_MODE === "test";

const filesToUpdate = [
  {
    path: path.join(projectRoot, "contract/test-deps/tapp/Move.toml"),
    prodTemplate: path.join(
      projectRoot,
      "contract/test-deps/tapp/Move.toml.prod",
    ),
    devTemplate: path.join(
      projectRoot,
      "contract/test-deps/tapp/Move.toml.dev",
    ),
    name: "Tapp",
  },
];

for (const file of filesToUpdate) {
  try {
    // Choose the appropriate template based on mode
    const templatePath = isTestMode ? file.devTemplate : file.prodTemplate;

    if (!fs.existsSync(templatePath)) {
      console.warn(
        `  Template not found: ${templatePath}, using current file`,
      );
      // Fallback to updating current file
      let content = fs.readFileSync(file.path, "utf-8");

      // Update addresses in place
      content = content.replace(
        /VeriFiPublisher\s*=\s*"0x[a-fA-F0-9]+"/g,
        `VeriFiPublisher = "${publisherAddress}"`,
      );
      content = content.replace(
        /^base\s*=\s*"[^"]*"/m,
        `base = "${publisherAddress}"`,
      );
      content = content.replace(
        /^tapp\s*=\s*"[^"]*"/m,
        `tapp = "${publisherAddress}"`,
      );

      fs.writeFileSync(file.path, content, "utf-8");
      console.log(` Updated ${file.name} (in-place): ${file.path}`);
      continue;
    }

    // Copy template and update addresses
    let content = fs.readFileSync(templatePath, "utf-8");

    // Update all publisher addresses
    content = content.replace(/0x[a-fA-F0-9]{64}/g, publisherAddress);

    fs.writeFileSync(file.path, content, "utf-8");
    const mode = isTestMode ? "test" : "deployment";
    console.log(` Updated ${file.name} for ${mode} mode: ${file.path}`);
  } catch (error: any) {
    console.error(` Failed to update ${file.name}:`, error.message);
  }
}

console.log("\n All addresses updated successfully!");

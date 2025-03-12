import { GitHubProjectManager } from "./index";

async function main() {
  // Your project number is 4 based on the URL you provided
  const projectManager = new GitHubProjectManager(4, "dougwithseismic");

  try {
    // List all items in your project
    const projectItems = await projectManager.listProjectItems();
    console.log("Project items:", JSON.stringify(projectItems, null, 2));

    // Example: Add a new issue to the project
    // Note: You'll need the content ID of the issue you want to add
    // const issueId = "YOUR_ISSUE_ID";
    // await projectManager.addItemToProject(issueId);

    // Example: Update a field value
    // Note: You'll need the item ID and field ID
    // await projectManager.updateProjectField("ITEM_ID", "FIELD_ID", "New Value");
  } catch (error) {
    console.error("Error:", error);
  }
}

main();

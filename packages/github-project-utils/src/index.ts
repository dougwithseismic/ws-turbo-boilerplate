import { graphql } from "@octokit/graphql";
import dotenv from "dotenv";

dotenv.config();

const graphqlWithAuth = graphql.defaults({
  headers: {
    authorization: `token ${process.env.GITHUB_TOKEN}`,
  },
});

export class GitHubProjectManager {
  constructor(
    private projectNumber: number,
    private ownerName: string,
  ) {}

  async getProjectId(): Promise<string> {
    const query = `
      query($owner: String!, $number: Int!) {
        user(login: $owner) {
          projectV2(number: $number) {
            id
          }
        }
      }
    `;

    const result = await graphqlWithAuth(query, {
      owner: this.ownerName,
      number: this.projectNumber,
    });

    return result.user.projectV2.id;
  }

  async addItemToProject(contentId: string): Promise<void> {
    const projectId = await this.getProjectId();
    const mutation = `
      mutation($projectId: ID!, $contentId: ID!) {
        addProjectV2ItemById(input: {
          projectId: $projectId
          contentId: $contentId
        }) {
          item {
            id
          }
        }
      }
    `;

    await graphqlWithAuth(mutation, {
      projectId,
      contentId,
    });
  }

  async updateProjectField(
    itemId: string,
    fieldId: string,
    value: string,
  ): Promise<void> {
    const mutation = `
      mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $value: String!) {
        updateProjectV2ItemFieldValue(input: {
          projectId: $projectId
          itemId: $itemId
          fieldId: $fieldId
          value: $value
        }) {
          projectV2Item {
            id
          }
        }
      }
    `;

    const projectId = await this.getProjectId();
    await graphqlWithAuth(mutation, {
      projectId,
      itemId,
      fieldId,
      value,
    });
  }

  async listProjectItems() {
    const query = `
      query($owner: String!, $number: Int!) {
        user(login: $owner) {
          projectV2(number: $number) {
            items(first: 100) {
              nodes {
                id
                content {
                  ... on Issue {
                    title
                    url
                  }
                  ... on PullRequest {
                    title
                    url
                  }
                }
                fieldValues(first: 100) {
                  nodes {
                    ... on ProjectV2ItemFieldTextValue {
                      text
                      field {
                        name
                      }
                    }
                    ... on ProjectV2ItemFieldDateValue {
                      date
                      field {
                        name
                      }
                    }
                    ... on ProjectV2ItemFieldSingleSelectValue {
                      name
                      field {
                        name
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    return await graphqlWithAuth(query, {
      owner: this.ownerName,
      number: this.projectNumber,
    });
  }
}

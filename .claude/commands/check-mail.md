Use the MailFail MCP tools to check all inboxes for the user. Do these steps:

1. Call `list_inboxes` to get all inboxes
2. For each inbox, call `list_emails` (limit 5) to show recent emails
3. Summarize: how many inboxes, how many unread emails per inbox, list the most recent email subjects
4. If there are new/unread emails, ask if the user wants to read any of them in detail or check their links

import { relations } from "drizzle-orm";

import { activityLogs } from "./activity_logs";
import { clients } from "./clients";
import { listClients } from "./list_clients";
import { lists } from "./lists";
import { sessions } from "./sessions";
import { users } from "./users";

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  lists: many(lists),
  activityLogs: many(activityLogs),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const listsRelations = relations(lists, ({ one, many }) => ({
  creator: one(users, {
    fields: [lists.createdBy],
    references: [users.id],
  }),

  clients: many(listClients),
}));

export const clientsRelations = relations(clients, ({ many }) => ({
  lists: many(listClients),
}));

export const listClientsRelations = relations(listClients, ({ one }) => ({
  list: one(lists, {
    fields: [listClients.listId],
    references: [lists.id],
  }),

  client: one(clients, {
    fields: [listClients.clientId],
    references: [clients.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

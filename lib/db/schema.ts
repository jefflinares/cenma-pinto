import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  decimal
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: varchar('role', { length: 20 }).notNull().default('member'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

export const teams = pgTable('teams', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  stripeCustomerId: text('stripe_customer_id').unique(),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  stripeProductId: text('stripe_product_id'),
  planName: varchar('plan_name', { length: 50 }),
  subscriptionStatus: varchar('subscription_status', { length: 20 }),
});

export const teamMembers = pgTable('team_members', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  role: varchar('role', { length: 50 }).notNull(),
  joinedAt: timestamp('joined_at').notNull().defaultNow(),
});

export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  userId: integer('user_id').references(() => users.id),
  action: text('action').notNull(),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  ipAddress: varchar('ip_address', { length: 45 }),
});

export const invitations = pgTable('invitations', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  email: varchar('email', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(),
  invitedBy: integer('invited_by')
    .notNull()
    .references(() => users.id),
  invitedAt: timestamp('invited_at').notNull().defaultNow(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
});

export const teamsRelations = relations(teams, ({ many }) => ({
  teamMembers: many(teamMembers),
  activityLogs: many(activityLogs),
  invitations: many(invitations),
}));

export const usersRelations = relations(users, ({ many }) => ({
  teamMembers: many(teamMembers),
  invitationsSent: many(invitations),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
  team: one(teams, {
    fields: [invitations.teamId],
    references: [teams.id],
  }),
  invitedBy: one(users, {
    fields: [invitations.invitedBy],
    references: [users.id],
  }),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  team: one(teams, {
    fields: [activityLogs.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
export type TeamMember = typeof teamMembers.$inferSelect;
export type NewTeamMember = typeof teamMembers.$inferInsert;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;
export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;
export type TeamDataWithMembers = Team & {
  teamMembers: (TeamMember & {
    user: Pick<User, 'id' | 'name' | 'email'>;
  })[];
};
export type Truck = typeof trucks.$inferSelect;
export type NewTruck = typeof trucks.$inferInsert;
export type Provider = typeof providers.$inferSelect;
export type NewProvider = typeof providers.$inferInsert;
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
// export type ProductClassification = typeof productClassifications.$inferSelect;
// export type NewProductClassification = typeof productClassifications.$inferInsert;
export type Container = typeof containers.$inferSelect;
export type NewContainer = typeof containers.$inferInsert;
export type Income = typeof incomes.$inferSelect;
export type NewIncome = typeof incomes.$inferInsert;
export type IncomeTruck = typeof incomeTrucks.$inferSelect;
export type NewIncomeTruck = typeof incomeTrucks.$inferInsert;
export type IncomeDetail = typeof incomeDetails.$inferSelect;
export type NewIncomeDetail = typeof incomeDetails.$inferInsert;
export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;
export type CustomerAccount = typeof customerAccounts.$inferSelect;
export type NewCustomerAccount = typeof customerAccounts.$inferInsert;
export type CustomerOrder = typeof customerOrders.$inferSelect;
export type NewCustomerOrder = typeof customerOrders.$inferInsert;
export type CustomerOrderDetail = typeof customerOrderDetails.$inferSelect;
export type NewCustomerOrderDetail = typeof customerOrderDetails.$inferInsert;
export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
export type CashMovement = typeof cashMovements.$inferSelect;
export type NewCashMovement = typeof cashMovements.$inferInsert;


export enum ActivityType {
  SIGN_UP = 'SIGN_UP',
  SIGN_IN = 'SIGN_IN',
  SIGN_OUT = 'SIGN_OUT',
  UPDATE_PASSWORD = 'UPDATE_PASSWORD',
  DELETE_ACCOUNT = 'DELETE_ACCOUNT',
  UPDATE_ACCOUNT = 'UPDATE_ACCOUNT',
  CREATE_TEAM = 'CREATE_TEAM',
  REMOVE_TEAM_MEMBER = 'REMOVE_TEAM_MEMBER',
  INVITE_TEAM_MEMBER = 'INVITE_TEAM_MEMBER',
  ACCEPT_INVITATION = 'ACCEPT_INVITATION',
  CREATE_PROVIDER = 'CREATE_PROVIDER',
  UPDATE_PROVIDER = 'UPDATE_PROVIDER',
  DELETE_PROVIDER = 'DELETE_PROVIDER',
  CREATE_TRUCK = 'CREATE_TRUCK',
  UPDATE_TRUCK = 'UPDATE_TRUCK',
  DELETE_TRUCK = 'DELETE_TRUCK',
  CREATE_PRODUCT = 'CREATE_PRODUCT',
  UPDATE_PRODUCT = 'UPDATE_PRODUCT',
  DELETE_PRODUCT = 'DELETE_PRODUCT',
  CREATE_INCOME = 'CREATE_INCOME',
  UPDATE_INCOME = 'UPDATE_INCOME',
  DELETE_INCOME = 'DELETE_INCOME',
  CREATE_CUSTOMER = 'CREATE_CUSTOMER',
  UPDATE_CUSTOMER = 'UPDATE_CUSTOMER',
  DELETE_CUSTOMER = 'DELETE_CUSTOMER',
  CREATE_ORDER = 'CREATE_ORDER',
  UPDATE_ORDER = 'UPDATE_ORDER',
  DELETE_ORDER = 'DELETE_ORDER',
  CREATE_PAYMENT = 'CREATE_PAYMENT',
  UPDATE_PAYMENT = 'UPDATE_PAYMENT',
  DELETE_PAYMENT = 'DELETE_PAYMENT',
  CREATE_CASH_MOVEMENT = 'CREATE_CASH_MOVEMENT',
  UPDATE_CASH_MOVEMENT = 'UPDATE_CASH_MOVEMENT',
  DELETE_CASH_MOVEMENT = 'DELETE_CASH_MOVEMENT',
  CREATE_CONTAINER = 'CREATE_CONTAINER',
  UPDATE_CONTAINER = 'UPDATE_CONTAINER',
  DELETE_CONTAINER = 'DELETE_CONTAINER',
  CREATE_CLASSIFICATION = 'CREATE_CLASSIFICATION',
  UPDATE_CLASSIFICATION = 'UPDATE_CLASSIFICATION',
  DELETE_CLASSIFICATION = 'DELETE_CLASSIFICATION',
}


export const providers = pgTable('providers', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  address: text('address'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

export const trucks = pgTable('trucks', {
  plate: varchar('plate', { length: 20 }).primaryKey(),
  ownerId: integer('owner_id').references(() => providers.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});


/* export const productClassifications = pgTable('product_classifications', {
  id: serial('id').primaryKey(),
  productId: integer('product_id').notNull().references(() => products.id),
  name: varchar('name', { length: 100 }).notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});
 */

export const containers = pgTable('containers', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 50 }).notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

export const incomes = pgTable('incomes', {
  id: serial('id').primaryKey(),
  date: timestamp('date').defaultNow().notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});


export const incomeTrucks = pgTable('income_trucks', {
  id: serial('id').primaryKey(),
  incomeId: integer('income_id').notNull().references(() => incomes.id),
  truckPlate: varchar('truck_plate', { length: 20 }).notNull().references(() => trucks.plate),
  driverName: varchar('driver_name', { length: 100 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

export const incomeDetails = pgTable('income_details', {
  id: serial('id').primaryKey(),
  incomeTruckId: integer('income_truck_id').notNull().references(() => incomeTrucks.id),
  providerId: integer('provider_id').notNull().references(() => providers.id),
  productId: integer('product_id').notNull().references(() => products.id),
  // classificationId: integer('classification_id').notNull().references(() => productClassifications.id),
  containerId: integer('container_id').notNull().references(() => containers.id),
  quantity: decimal('quantity', { precision: 10, scale: 2 }).notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

export const customers = pgTable('customers', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 255 }),
  address: text('address'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

export const customerAccounts = pgTable('customer_accounts', {
  id: serial('id').primaryKey(),
  customerId: integer('customer_id').notNull().references(() => customers.id),
  periodStart: timestamp('period_start').notNull(),
  periodEnd: timestamp('period_end').notNull(),
  balance: decimal('balance', { precision: 10, scale: 2 }).notNull().default('0'),
});


export const customerOrders = pgTable('customer_orders', {
  id: serial('id').primaryKey(),
  customerId: integer('customer_id').notNull().references(() => customers.id),
  date: timestamp('date').defaultNow().notNull(),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

export const customerOrderDetails = pgTable('customer_order_details', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').notNull().references(() => customerOrders.id),
  productId: integer('product_id').notNull().references(() => products.id),
  // classificationId: integer('classification_id').notNull().references(() => productClassifications.id),
  containerId: integer('container_id').notNull().references(() => containers.id),
  quantity: decimal('quantity', { precision: 10, scale: 2 }).notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});


export const payments = pgTable('payments', {
  id: serial('id').primaryKey(),
  customerId: integer('customer_id').notNull().references(() => customers.id),
  date: timestamp('date').defaultNow().notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  paymentType: varchar('payment_type', { length: 20 }).notNull(),
  receiptNumber: varchar('receipt_number', { length: 100 }),
  createdBy: integer('created_by').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});


export const cashMovements = pgTable('cash_movements', {
  id: serial('id').primaryKey(),
  date: timestamp('date').defaultNow().notNull(),
  concept: text('concept').notNull(),
  type: varchar('type', { length: 10 }).notNull(), // 'INCOME' | 'EXPENSE' | 'INITIAL'
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
});

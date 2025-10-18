/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as aiHumiliation from "../aiHumiliation.js";
import type * as aiMemory from "../aiMemory.js";
import type * as aiSocialDestruction from "../aiSocialDestruction.js";
import type * as challengeInvites from "../challengeInvites.js";
import type * as challengeSets from "../challengeSets.js";
import type * as challengeWars from "../challengeWars.js";
import type * as challenges from "../challenges.js";
import type * as cleanup from "../cleanup.js";
import type * as cronHandlers from "../cronHandlers.js";
import type * as crons from "../crons.js";
import type * as email from "../email.js";
import type * as friends from "../friends.js";
import type * as habitCompletions from "../habitCompletions.js";
import type * as habits from "../habits.js";
import type * as notifications from "../notifications.js";
import type * as rewards from "../rewards.js";
import type * as seedHabits from "../seedHabits.js";
import type * as splitwise from "../splitwise.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  aiHumiliation: typeof aiHumiliation;
  aiMemory: typeof aiMemory;
  aiSocialDestruction: typeof aiSocialDestruction;
  challengeInvites: typeof challengeInvites;
  challengeSets: typeof challengeSets;
  challengeWars: typeof challengeWars;
  challenges: typeof challenges;
  cleanup: typeof cleanup;
  cronHandlers: typeof cronHandlers;
  crons: typeof crons;
  email: typeof email;
  friends: typeof friends;
  habitCompletions: typeof habitCompletions;
  habits: typeof habits;
  notifications: typeof notifications;
  rewards: typeof rewards;
  seedHabits: typeof seedHabits;
  splitwise: typeof splitwise;
  users: typeof users;
}>;
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {};

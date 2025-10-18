/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as challengeSets from "../challengeSets.js";
import type * as challenges from "../challenges.js";
import type * as cronHandlers from "../cronHandlers.js";
import type * as crons from "../crons.js";
import type * as email from "../email.js";
import type * as friends from "../friends.js";
import type * as groqVerificationActions from "../groqVerificationActions.js";
import type * as habitChallenges from "../habitChallenges.js";
import type * as habitCompletions from "../habitCompletions.js";
import type * as habitVerification from "../habitVerification.js";
import type * as habits from "../habits.js";
import type * as notifications from "../notifications.js";
import type * as seedHabits from "../seedHabits.js";
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
  challengeSets: typeof challengeSets;
  challenges: typeof challenges;
  cronHandlers: typeof cronHandlers;
  crons: typeof crons;
  email: typeof email;
  friends: typeof friends;
  groqVerificationActions: typeof groqVerificationActions;
  habitChallenges: typeof habitChallenges;
  habitCompletions: typeof habitCompletions;
  habitVerification: typeof habitVerification;
  habits: typeof habits;
  notifications: typeof notifications;
  seedHabits: typeof seedHabits;
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

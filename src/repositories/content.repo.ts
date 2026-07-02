import { db } from '../db/db'
import { makeRepo } from './base'

export const routinesRepo = makeRepo(db.routines)
export const choresRepo = makeRepo(db.chores)
export const scheduleRepo = makeRepo(db.scheduleItems)
export const rewardsRepo = makeRepo(db.rewards)
export const challengesRepo = makeRepo(db.challenges)
export const holidayRepo = makeRepo(db.holidayPeriods)

export const listRoutines = () => db.routines.toArray()
export const listChores = () => db.chores.toArray()
export const listSchedule = () => db.scheduleItems.toArray()
export const listRewards = () => db.rewards.toArray()
export const listChallenges = () => db.challenges.toArray()
export const listHolidayPeriods = () => db.holidayPeriods.toArray()
export const listBadges = () => db.badges.toArray()
export const listBadgeAwards = () => db.badgeAwards.toArray()

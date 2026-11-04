import common from "./common"
import auth from "./auth"
import landing from "./landing"
import courses from "./courses"
import dashboard from "./dashboard"
import classroom from "./classroom"
import payments from "./payments"
import errors from "./errors"
import type { DotPaths } from "../../types"

const en = {
  common,
  auth,
  landing,
  courses,
  dashboard,
  classroom,
  payments,
  errors,
}

export type Dictionary = typeof en
export type TranslationKey = DotPaths<Dictionary>

export default en

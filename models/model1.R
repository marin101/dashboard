##################### This code prints the values of command-line parameters for UI Testing ######################

cmdArgs = commandArgs(trailingOnly = TRUE)
destination = cmdArgs[1]
run         = cmdArgs[2]

if (as.integer(run) == 1) {

  file1 = cmdArgs[3]
  depvar = cmdArgs[4]
  geobrand = cmdArgs[5]
  subject = cmdArgs[6]
  period = cmdArgs[7]
  pbounds = cmdArgs[8]
  datefmt = cmdArgs[9]
  lst_dim = cmdArgs[10]
  impute = cmdArgs[11]
  outlier = cmdArgs[12]
  static = cmdArgs[13]

  print(paste("Read parameters: ",
              'file1 = ', file1,
              'depvar = ', depvar,
              'geobrand = ', geobrand,
              'subject = ', subject,
              'period = ', period,
              'pbounds = ', pbounds,
              'datefmt = ', datefmt,
              'lst_dim = ', lst_dim,
              'impute = ', impute,
              'outlier = ', outlier,
              'static = ', static,
              sep = ' | '
  ))

} else if (as.integer(run) == 2) {

  use_decay = cmdArgs[3]
  decay_bounds = cmdArgs[4]
  use_log = cmdArgs[8]
  use_mc = cmdArgs[9]

  print(paste("Prep parameters: ",
              'use_decay = ', use_decay,
              'decay_bounds = ', decay_bounds,
              'use_log = ', use_log,
              'use_mc = ', use_mc,
              sep = ' | '
  ))

} else if (as.integer(run) == 3) {

  use_geobrand = cmdArgs[3]
  use_seas = cmdArgs[4]
  lst_seas = cmdArgs[5]
  lst_rand = cmdArgs[6]
  covstr = cmdArgs[7]
  use_stat = cmdArgs[8]
  use_prior = cmdArgs[9]
  lst_prior = cmdArgs[10]
  mixnmatch = cmdArgs[11]
  drop_period = cmdArgs[12]
  drop_subject = cmdArgs[13]
  use_trendseas = cmdArgs[15]
  lst_cost = cmdArgs[16]
  margin = cmdArgs[17]

  print(paste("Model parameters: ",
              'use_geobrand = ', use_geobrand,
              'use_seas = ', use_seas,
              'lst_seas = ', lst_seas,
              'lst_rand = ', lst_rand,
              'covstr = ', covstr,
              'use_stat = ', use_stat,
              'use_prior = ', use_prior,
              'lst_prior = ', lst_prior,
              'mixnmatch = ', mixnmatch,
              'drop_period = ', drop_period,
              'drop_subject = ', drop_subject,
              'use_trendseas = ', use_trendseas,
              'lst_cost = ', lst_cost,
              'margin = ', margin,
              sep = ' | '
  ))

} else if (as.numeric(run) == 4) {

  optim_goal = cmdArgs[3]
  budget_factor = cmdArgs[4]
  sales_factor = cmdArgs[5]

  print(paste("Prep parameters: ",
              'optim_goal = ', optim_goal,
              'budget_factor = ', budget_factor,
              'sales_factor = ', sales_factor,
              sep = ' | '
  ))

}

##################### This code prints the values of command-line parameters for UI Testing ######################

cmdArgs = commandArgs(trailingOnly = TRUE)
new_session  = cmdArgs[1]
save_session = cmdArgs[2]
sessionID    = cmdArgs[3]
run          = cmdArgs[4]

if (as.integer(run) == 1) {

  file1 = cmdArgs[5]
  depvar = cmdArgs[6]
  geobrand = cmdArgs[7]
  subject = cmdArgs[8]
  period = cmdArgs[9]
  pbounds = cmdArgs[10]
  datefmt = cmdArgs[11]
  lst_dim = cmdArgs[12]
  impute = cmdArgs[13]
  outlier = cmdArgs[14]
  static = cmdArgs[15]
  
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
    
  use_decay = cmdArgs[5]
  decay_bounds = cmdArgs[6]
  use_log = cmdArgs[7]
  use_mc = cmdArgs[8]
  
  print(paste("Prep parameters: ",
              'use_decay = ', use_decay,
              'decay_bounds = ', decay_bounds,
              'use_log = ', use_log,
              'use_mc = ', use_mc,
              sep = ' | '
  ))
    
} else if (as.integer(run) == 3) {

  use_geobrand = cmdArgs[5]
  use_seas = cmdArgs[6]
  lst_seas = cmdArgs[7]
  lst_rand = cmdArgs[8]
  covstr = cmdArgs[9]
  use_stat = cmdArgs[10]
  use_prior = cmdArgs[11]
  lst_prior = cmdArgs[12]
  mixnmatch = cmdArgs[13]
  drop_period = cmdArgs[14]
  drop_subject = cmdArgs[15]
  use_trendseas = cmdArgs[16]
  lst_cost = cmdArgs[17]
  margin = cmdArgs[18]
    
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
    
  optim_goal = cmdArgs[5]
  budget_factor = cmdArgs[6]
  sales_factor = cmdArgs[7]

  print(paste("Prep parameters: ",
              'optim_goal = ', optim_goal,
              'budget_factor = ', budget_factor,
              'sales_factor = ', sales_factor,
              sep = ' | '
  ))

}
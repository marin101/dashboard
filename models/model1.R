#!/usr/bin/Rscript

#scripts for this module
scrList = c('Run','Read', 'Prep','Model','optim')

#user args for this module
#0=Session | 1=Read | 2=Prep | 3=Model | 4=Optim
argsList0 = c( 'run')
argsList1 = c('file1','depvar','geobrand','subject','period','pstart','pend','datefmt','lst_dim','impute','outlier','static')
argsList2 = c('use_geobrand','use_decay','min_decay','max_decay','use_log','use_mc')
argsList3 = c('use_seas','lst_seas','lst_rand','covstr','use_stat','use_prior','lst_prior','mixnmatch',
              'drop_period','drop_subject','use_trendseas','lst_cost','margin')
argsList4 = c('optim_goal','budget_factor','sales_factor')

argsList = list(argsList0, argsList1, argsList2,argsList3, argsList4)
names(argsList) = c( scrList)

cmdArgs = commandArgs(trailingOnly = TRUE)
run          = cmdArgs[1]

if(as.numeric(run)==1){
  file1 = cmdArgs[2]
  depvar = cmdArgs[3]
  geobrand = cmdArgs[4]
  subject = cmdArgs[5]
  period = cmdArgs[6]
  pstart = cmdArgs[7]
  pend = cmdArgs[8]
  datefmt = cmdArgs[9]
  lst_dim = cmdArgs[10]
  impute = cmdArgs[11]
  outlier = cmdArgs[12]
  static = cmdArgs[13]

  print(paste("Read Script is running",file1,depvar,geobrand,subject,period,pstart,pend,datefmt,lst_dim,impute,outlier,static, sep=","))

  }else if(as.numeric(run)==2){

    use_geobrand = cmdArgs[2]
    use_decay = cmdArgs[3]
    min_decay = cmdArgs[4]
    max_decay = cmdArgs[5]
    use_log = cmdArgs[6]
    use_mc = cmdArgs[7]

    print(paste("Prep Script is Running",use_geobrand,use_decay,min_decay,max_decay,use_log,use_mc,sep=","))
  }else if(as.numeric(run)==3){
    use_seas = cmdArgs[2]
    lst_seas = cmdArgs[3]
    lst_rand = cmdArgs[4]
    covstr = cmdArgs[5]
    use_stat = cmdArgs[6]
    use_prior = cmdArgs[7]
    lst_prior = cmdArgs[8]
    mixnmatch = cmdArgs[9]
    drop_period = cmdArgs[10]
    drop_subject = cmdArgs[11]
    use_trendseas = cmdArgs[12]
    lst_cost = cmdArgs[13]
    margin = cmdArgs[14]

    print(paste("Model is running",use_seas,lst_seas,lst_rand,covstr,use_stat,use_prior,lst_prior,mixnmatch,drop_period,drop_subject,use_trendseas,lst_cost,margin, sep = ","))
  }else if (as.numeric(run)==4){
    optim_goal = cmdArgs[2]
    budget_factor = cmdArgs[3]
    sales_factor = cmdArgs[4]

    print(paste("Model is running",optim_goal,budget_factor,sales_factor, sep=","))
}

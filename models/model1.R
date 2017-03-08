#!/usr/bin/Rscript

cmdArgs = commandArgs(trailingOnly = TRUE)

#user args for LME module
argsList = c('run',
             'file1',
             'depvar',
             'subject',
             'period',
             'pstart',
             'pend',
             'datefmt',
             'lst_dim',
             'impute',
             'outlier',
             'static',
             'use_decay',
             'min_decay',
             'max_decay',
             'use_log',
             'use_mc',
             'use_seas',
             'lst_seas',
             'lst_rand',
             'covstr',
             'use_stat',
             'use_guess',
             'lst_guess',
             'mixnmatch',
             'lst_cost',
             'margin',
             'optim_goal',
             'budget_factor',
             'sales_factor',
             'nameMe')

for (i in 1:length(argsList)) assign(argsList[i], cmdArgs[i], .GlobalEnv)


# these value need to be captured by the UI element
# file1 will be the file name that user has uploaded from the UI
# filename can be the some JAVASCRIPT value that needs to be uploaded from UI



cat('\n', paste0('File:',file1));
cat('\n', paste0('Target Value :',depvar));
cat('\n', paste0('Subject Value :',subject));
cat('\n', paste0('Period Value:',period));
cat('\n', paste0('Starting Date :',pstart));
cat('\n', paste0('Ending Date :',pend));
cat('\n', paste0('Date Format:',datefmt));
cat('\n', paste0('Multiple Input :',lst_dim));
cat('\n', paste0('Impute Value :',impute));
cat('\n', paste0('outlier   :',outlier));
cat('\n', paste0('static           :',static        ));
cat('\n', paste0('use_decay        :',use_decay     ));
cat('\n', paste0('min_decay        :',min_decay     ));
cat('\n', paste0('max_decay        :',max_decay     ));
cat('\n', paste0('use_log          :',use_log       ));
cat('\n', paste0('use_mc           :',use_mc        ));
cat('\n', paste0('use_seas         :',use_seas      ));
cat('\n', paste0('lst_seas         :',lst_seas      ));
cat('\n', paste0('lst_rand   :',lst_rand));
cat('\n', paste0('covstr   :',covstr));
cat('\n', paste0('use_stat   :',use_stat));
cat('\n', paste0('use_guess   :',use_guess));
cat('\n', paste0('lst_guess   :',lst_guess));
cat('\n', paste0('lst_cost         :',lst_cost      ));
cat('\n', paste0('margin   :',margin));
cat('\n', paste0('optim_goal   :',optim_goal));
cat('\n', paste0('budget_factor    :',budget_factor ));
cat('\n', paste0('sales_factor   :',sales_factor));


source(file ='./models/file2.R', local = TRUE, verbose = FALSE, print.eval = TRUE, echo = FALSE)


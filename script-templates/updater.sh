#!/usr/bin/env bash
printf "\n******************************\n"
printf "Starting Aspen LiDA Updater...\n"
printf "******************************\n"
printf "Select release channel:\n"
PS3="> "
channels=("production" "beta" "alpha" "development" "development-local")
select item in "${channels[@]}"
do
    case $REPLY in
	*) channel=$item; break;;
    esac
done

instances=($(jq -c 'keys' '../app-configs/apps.json' | jq -r '.[]'))
declare -a instances
printf "Select instance:\n"
PS3="> "
select item in "${instances[@]}" all
do
  eval item=$item
    case $REPLY in
	*) slug=$item; break;;
    esac
done


if [[ $channel != 'development-local' ]]
then
  printf "Over-the-air update?\n"
  PS3="> "
  otaOptions=("yes" "no")
  select item in "${otaOptions[@]}"
  do
      case $REPLY in
	  *) otaUpdate=$item; break;;
      esac
  done

  if [[ $otaUpdate == 'yes' ]]
  then
    printf "\nBranch to send over-the-air update to: "
    read -r branchName
    printf "\nComment about the update: "
    read -r comment
  fi
fi

printf "Select platform(s):\n"
PS3="> "
if [[ $channel == 'development-local' ]]
then
  platforms=("ios" "android")
else
  platforms=("ios" "android" "all")
fi
select item in "${platforms[@]}"
do
    case $REPLY in
	*) osPlatform=$item; break;;
    esac
done

printf "******************************\n"

run_local_build() {
  local site=$1
  local platform=$2
  APP_ENV=$site eas build --platform $platform --profile development-local --local
}

if [[ $slug == 'all' ]]
then
  sites=($(jq -c 'keys' '../app-configs/apps.json' | jq -r '.[]'))
  declare -a sites
  for site in ${sites[@]}
      do
	eval site=$site
	 printf "\nUpdating %s in channel %s for %s platform(s)... \n" "$site" "$channel" "$osPlatform"
	  cd ../scripts
	  node copyConfig.js --instance=$site
	  node updateConfig.js --instance=$site --env=$channel
	  sed -i '' "s/{{APP_ENV}}/$site/g" ../code/eas.json
	  cd ../code
	  if [[ $channel == 'development-local' ]]
	  then
		run_local_build "$site" "$osPlatform"
	  elif [[ $otaUpdate == 'yes' ]]
	  then
	    APP_ENV=$site eas update --branch $branchName --message "$comment" --platform $osPlatform
	  else
	    APP_ENV=$site eas build --platform $osPlatform --profile $channel --no-wait
	  fi
      done
else
  printf "\nUpdating %s in channel %s for %s platform(s)... \n" "$slug" "$channel" "$osPlatform"
  cd ../scripts
  node copyConfig.js --instance=$slug
  node updateConfig.js --instance=$slug --env=$channel
  sed -i '' "s/{{APP_ENV}}/$slug/g" ../code/eas.json
  cd ../code
  if [[ $channel == 'development-local' ]]
  then
	run_local_build "$slug" "$osPlatform"
  elif [[ $otaUpdate == 'yes' ]]
  then
    APP_ENV=$slug eas update --branch $branchName --message "$comment" --platform $osPlatform
  else
    APP_ENV=$slug eas build --platform $osPlatform --profile $channel --no-wait
  fi
  cd ../scripts

fi

printf "******************************\n"
printf " 👌 Finished. Bye! \n"
exit

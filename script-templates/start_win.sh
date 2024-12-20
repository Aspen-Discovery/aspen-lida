#!/usr/bin/env bash
printf "\n******************************\n"
printf "Starting Aspen LiDA Launcher...\n"
printf "******************************\n"
printf "Select an instance to start:\n"
readarray -t instances < <(jq -c 'keys' '../app-configs/apps.json' | jq -r '.[]')
declare -a instances
PS3="> "
select item in "${instances[@]}"
do
  eval item=$item
    case $REPLY in
	*) site=$item; break;;
    esac
done

printf "Expo server mode:\n"
PS3="> "
serverOptions=("standard" "development" "production")
select item in "${serverOptions[@]}"
do
    case $REPLY in
	*) serverOption=$item; break;;
    esac
done
node copyConfig.js
node updateConfig.js --instance=$site --env=none
#sed -i "s/{{APP_ENV}}/$site/g" ../code/eas.json

cd ../code

if [[ $serverOption == 'development' ]]
then
  APP_ENV=$site npx expo start --dev-client --port 8082
elif [[ $serverOption == 'production' ]]
then
  APP_ENV=$site npx expo start --no-dev --minify --port 8082
else
    APP_ENV=$site npx expo start --clear --port 8082
  fi

cd ../scripts

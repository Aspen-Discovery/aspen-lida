{strip}
	<div id="main-content">
		{if !empty($loggedIn)}
			{if !empty($profile->_web_note)}
				<div class="row">
					<div id="web_note" class="alert alert-info text-center col-xs-12">{$profile->_web_note}</div>
				</div>
			{/if}
			{if !empty($accountMessages)}
				{include file='systemMessages.tpl' messages=$accountMessages}
			{/if}

			<h1>{$readerName}</h1>
			{if !empty($offline)}
				<div class="alert alert-warning"><strong>{translate text=$offlineMessage isPublicFacing=true}</strong></div>
			{else}
				<form action="" method="post">
					<input type="hidden" name="updateScope" value="overdrive">
					<div class="form-group propertyRow">
						<label for="overdriveEmail" class="control-label">{translate text='%1% Hold email' 1=$readerName isPublicFacing=true}</label>
						{if $edit == true}<input name="overdriveEmail" id="overdriveEmail" class="form-control" value='{$profile->overdriveEmail|escape}' size='50' maxlength='75'>{else}{$profile->overdriveEmail|escape}{/if}
					</div>
					<div class="form-group propertyRow">
						<label for="promptForOverdriveEmail" class="control-label">{translate text='Prompt for %1% email' 1=$readerName isPublicFacing=true}</label>&nbsp;
						{if $edit == true}
							<input type="checkbox" name="promptForOverdriveEmail" id="promptForOverdriveEmail" {if $profile->promptForOverdriveEmail==1}checked='checked'{/if} data-switch="">
						{else}
							{if $profile->promptForOverdriveEmail==0}{translate text="No" isPublicFacing=true}{else}{translate text="Yes" isPublicFacing=true}{/if}
						{/if}
					</div>
					<h2>{translate text="Default Lending Periods" isPublicFacing=true}</h2>
					{foreach from=$availableSettings item=setting}
						{assign var=settingId value=$setting->id}
						{assign var="options" value=$optionsBySetting.$settingId}
						{if !empty($options.lendingPeriods)}
							<h3>{translate text=$setting->name isPublicFacing=true}</h3>
							{foreach from=$options.lendingPeriods item=lendingPeriod}
								<div class="form-group propertyRow">
									<label class="control-label" id="{$lendingPeriod.formatType}_{$settingId}_Label">{translate text=$lendingPeriod.formatType isPublicFacing=true}&nbsp;
										<select class="form-control" aria-labelledby="{$lendingPeriod.formatType}_{$settingId}_Label" name="{$lendingPeriod.formatType}_{$settingId}">
										{foreach from=$lendingPeriod.options key=value item=optionName}
											<option value="{$optionName}" {if $optionName == $lendingPeriod.lendingPeriod}selected{/if}>{translate text="%1% days" 1=$optionName isPublicFacing=true}</option>
										{/foreach}
										</select>
									</label>
								</div>
							{/foreach}
						{/if}
					{/foreach}
					{if empty($offline) && $edit == true}
						<div class="form-group propertyRow">
							<button type="submit" name="updateOverDrive" class="btn btn-sm btn-primary">{translate text="Update Options" isPublicFacing=true}</button>
						</div>
					{/if}
				</form>

				<script type="text/javascript">
					{* Initiate any checkbox with a data attribute set to data-switch=""  as a bootstrap switch *}
					{literal}
					$(function(){ $('input[type="checkbox"][data-switch]').bootstrapSwitch()});
					{/literal}
				</script>
			{/if}
		{else}
			<div class="page">
				{translate text="You must sign in to view this information." isPublicFacing=true}<a href='/MyAccount/Login' class="btn btn-primary">{translate text="Sign In" isPublicFacing=true}</a>
			</div>
		{/if}
	</div>
{/strip}
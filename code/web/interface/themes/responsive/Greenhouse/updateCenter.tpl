{strip}
	<div class="row">
		<div class="col-xs-12 col-md-9">
			<h1 id="pageTitle">{$pageTitleShort}</h1>
		</div>
	</div>

	{*<p class="alert alert-info">
		{translate text="Quick Update to current version" isAdminFacing=true}
		<pre>
			cd /usr/local/aspen-discovery; sudo git pull origin {$gitBranch}
		</pre>
	</p>*}

	<form class="form well" id="updateCenterFilters" style="padding-bottom:1em">
		<div class="row align-middle">
			<div class="col-xs-12 col-md-4">
				<div class="form-group">
	                <label for="implementationStatusToShow">{translate text='Implementation Status' isAdminFacing=true}</label>
	                <select name="implementationStatusToShow" id="implementationStatusToShowSelect" class="form-control">
	                    <option value="any"{if !empty($implementationStatusToShow) && ($implementationStatusToShow == 'any')} selected='selected'{/if}>Any</option>
	                    {foreach from=$implementationStatuses item=status key=index}
	                        <option value="{$index}"{if !empty($implementationStatusToShow) && ($implementationStatusToShow == $index)} selected='selected'{/if}>{$status}</option>
	                    {/foreach}
	                </select>
	            </div>
			</div>
			<div class="col-xs-12 col-md-3">
				<div class="form-group">
	                <label for="siteTypeToShow">{translate text='Site Type' isAdminFacing=true}</label>
	                <select name="siteTypeToShow" id="siteTypeToShowSelect" class="form-control">
	                    <option value="any"{if !empty($siteTypeToShow) && ($siteTypeToShow == 'any')} selected='selected'{/if}>Any</option>
		                {foreach from=$siteTypes item=type key=index}
		                    <option value="{$index}"{if !empty($siteTypeToShow) && ($siteTypeToShow == $index)} selected='selected'{/if}>{$type}</option>
		                {/foreach}
	                </select>
	            </div>
			</div>
			<div class="col-xs-12 col-md-3">
				<div class="form-group">
	                <label for="releaseToShow">{translate text='Version' isAdminFacing=true}</label>
	                <select name="releaseToShow" id="releaseToShowSelect" class="form-control">
                        <option value="any"{if !empty($releaseToShow) && ($releaseToShow == 'any')} selected='selected'{/if}>Any</option>
	                    {foreach from=$releases item=release}
	                        <option value="{$release.version}"{if !empty($releaseToShow) && ($releaseToShow == $release.version)} selected='selected'{/if}>{$release.version}</option>
	                    {/foreach}
	                </select>
	            </div>
			</div>
			<div class="col-xs-12 col-md-2">
				<div class="btn-group btn-group-sm btn-group-justified" role="group">
		            <div class="btn-group" role="group">
		                <button class="btn btn-primary" type="submit">{translate text="Apply" isAdminFacing=true}</button>
		            </div>
		            <div class="btn-group" role="group">
		                <a class="btn btn-default" href="{$url}/Greenhouse/UpdateCenter">{translate text="Reset" isAdminFacing=true}</a>
		            </div>
	            </div>
			</div>
		</div>
	</form>

	<div class="row">
		<div class="col-xs-12">
			<div class="btn-toolbar" role="toolbar">
                <div class="btn-group" role="group">
                    <a onclick="return AspenDiscovery.Admin.showSelectedScheduleUpdateForm();" class="btn btn-default"><i class="fas fa-wrench"></i> Schedule Update for Selected</a>
                    <a onclick="return AspenDiscovery.Admin.showBatchScheduleUpdateForm();" class="btn btn-default"><i class="fas fa-wrench"></i> Schedule Update for All</a>
                </div>
			</div>
		</div>
	</div>

	<div class="siteStatusRegion">
		<table class="table table-striped table-condensed smallText table-sticky" id="siteStatusTable" aria-label="{translate text="List of sites to update" inAttribute=true isAdminFacing=true}">
			<thead>
				<tr>
					<th width="5%"></th>
					<th>{translate text="Name" isAdminFacing=true}</th>
					<th>{translate text="Version" isAdminFacing=true}</th>
					<th>{translate text="Site Type" isAdminFacing=true}</th>
					<th>{translate text="Timezone" isAdminFacing=true}</th>
					<th>{translate text="Implementation Status" isAdminFacing=true}</th>
					<th>{translate text="Hosting" isAdminFacing=true}</th>
					<th>{translate text="Last Scheduled Update" isAdminFacing=true}</th>
					<th>{translate text="Last Successful Update" isAdminFacing=true}</th>
					<th>{translate text="DB Maintenance" isAdminFacing=true}</th>
				</tr>
			</thead>
			<tbody>
				{foreach from=$allSites item="site"}
					<tr>
						<td>
							{if !$site->optOutBatchUpdates}
								<input type="checkbox" class="form-control siteSelect" name="{$site->id}" id="{$site->id}">
							{/if}
						</td>
						<td>
							<a href="{$site->baseUrl}" target="_blank">{$site->name}</a>
						</td>
						<td>
							{$site->version}<br>
							<a class="btn btn-xs btn-warning" onclick="return AspenDiscovery.Admin.showScheduleUpdateForm('{$site->id}');"><i class="far fa-clock"></i> {translate text="Schedule Update" isAdminFacing=true}</a>
						</td>
						<td>
                            {translate text=$site->getSiteTypeName() isAdminFacing=true}
						</td>
						<td>
                            {translate text=$site->getTimezoneName() isAdminFacing=true}
						</td>
						<td>
							{translate text=$site->getImplementationStatusName() isAdminFacing=true}
						</td>
						<td>
                            {$site->hosting}
						</td>
						<td>
						{assign var='lastScheduledUpdate' value=$site->getLastScheduledUpdate()}
							{if $lastScheduledUpdate['time'] !== 'Never'}
								<a href="/Admin/ScheduledUpdates?objectAction=edit&id={$lastScheduledUpdate['id']}">{$lastScheduledUpdate['time']}</a>
							{else}
								{$lastScheduledUpdate['time']}
							{/if}
						</td>
						<td>
							{assign var='lastSuccessfulUpdate' value=$site->getLastSuccessfulUpdate()}
							{if $lastSuccessfulUpdate['time'] !== 'Never'}
                                <a href="/Admin/ScheduledUpdates?objectAction=edit&id={$lastSuccessfulUpdate['id']}">{$lastSuccessfulUpdate['time']}</a>
                            {else}
                                {$lastSuccessfulUpdate['time']}
                            {/if}
						</td>
						<td>
							<a class="btn btn-xs btn-default" href="{$site->baseUrl}/Admin/DBMaintenance" target="_blank"><i class="fas fa-external-link-alt"></i> {translate text="Run" isAdminFacing=true}</a>
						</td>
					</tr>
				{/foreach}
			</tbody>
		</table>
	</div>
{/strip}

<script type="text/javascript">
{literal}
	$("#siteStatusTable").tablesorter({cssAsc: 'sortAscHeader', cssDesc: 'sortDescHeader', cssHeader: 'unsortedHeader', widgets:['zebra', 'filter']});
{/literal}
</script>
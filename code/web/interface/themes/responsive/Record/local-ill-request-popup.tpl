{strip}
<div id="page-content" class="content">
	{if !empty($fromHoldError)}
		<p class="alert alert-danger">{translate text='Sorry, we could not place a hold on that title for you. Would you like to make an Interlibrary Loan Request instead?' isPublicFacing='true'}</p>
	{/if}
	{$localIllFormFields}
</div>
{/strip}

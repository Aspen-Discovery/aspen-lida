import React from 'react';
import { Accordion, AccordionItem, AccordionHeader, AccordionTrigger, AccordionTitleText, AccordionIcon, AccordionContent, AccordionContentText, Box, Button, ButtonText, FlatList, Heading, HStack, Spinner, Text, VStack, ChevronUpIcon, ChevronDownIcon } from '@gluestack-ui/themed';
import { clearApiErrorLogs, getApiErrorLogsPage } from '../../../../util/db';
import { LanguageContext, ThemeContext } from '../../../../context/initialContext';
import { getTermFromDictionary } from '../../../../translations/TranslationService';

/* move this to the helpers.js */
function formatDate(ms) {
     try {
          return new Date(ms).toLocaleString();
     } catch {
          return String(ms);
     }
}

export const APIErrorLog = ({ theme: themeProp, colorMode: colorModeProp, textColor: textColorProp } = {}) => {
     const [loading, setLoading] = React.useState(false);
     const [page, setPage] = React.useState(1);
     const [rows, setRows] = React.useState([]);
     const [meta, setMeta] = React.useState({
          total: 0,
          totalPages: 1,
          hasMore: false,
          hasPrevious: false,
     });

     const languageCtx = React.useContext(LanguageContext) ?? {};
     const language = languageCtx.language ?? 'en';

     const themeCtx = React.useContext(ThemeContext) ?? {};
     const theme = themeProp ?? themeCtx.theme ?? {};
     const colorMode = colorModeProp ?? themeCtx.colorMode ?? 'light';
     const textColor = textColorProp ?? themeCtx.textColor ?? '#111827';

     const loadPage = React.useCallback(async (nextPage = 1) => {
          setLoading(true);
          try {
               const result = await getApiErrorLogsPage({
                    page: nextPage,
                    pageSize: 25,
                    last24HoursOnly: true,
               });

               setRows(result.items);
               setPage(result.page);
               setMeta({
                    total: result.total,
                    totalPages: result.totalPages,
                    hasMore: result.hasMore,
                    hasPrevious: result.hasPrevious,
               });
          } finally {
               setLoading(false);
          }
     }, []);

     React.useEffect(() => {
          loadPage(1);
     }, [loadPage]);

     const onClear = async () => {
          setLoading(true);
          try {
               await clearApiErrorLogs();
               await loadPage(1);
          } finally {
               setLoading(false);
          }
     };

     const renderEntry = ({ item }) => (
          <Box borderBottomWidth="$1" borderColor={colorMode === 'light' ? theme['colors']['coolGray']['200'] : theme['colors']['gray']['600']} px="$3" py="$3">
               <VStack space="xs">
                    <Text size="xs" color={textColor}>
                         {formatDate(item.created_at)}
                    </Text>
                    <Text bold size="sm" color={textColor}>
                         {(item.method ?? 'UNKNOWN') + ' ' + (item.endpoint ?? '-')}
                    </Text>
                    <Text size="xs" color={textColor}>
                         {'status=' + (item.status ?? 'n/a') + '  problem=' + (item.problem ?? 'n/a')}
                    </Text>
                    <Text color={textColor}>{item.requestParams}</Text>
                    {item.message ? (
                         <>
                              <Text size="xs" color={textColor}>
                                   {item.message ?? ''}
                              </Text>
                         </>
                    ) : null}

                    {item.response_body ? (
                         <Accordion>
                              <AccordionItem value="response_body" bgColor={colorMode === 'light' ? theme['colors']['coolGray']['100'] : theme['colors']['coolGray']['700']}>
                                   <AccordionHeader bgColor={colorMode === 'light' ? theme['colors']['coolGray']['100'] : theme['colors']['coolGray']['700']}>
                                        <AccordionTrigger>
                                             {({ isExpanded }) => {
                                                  return (
                                                       <>
                                                            <AccordionTitleText color={textColor}>Response</AccordionTitleText>
                                                            {isExpanded ? <AccordionIcon as={ChevronUpIcon} ml="$3" color={textColor} /> : <AccordionIcon as={ChevronDownIcon} ml="$3" color={textColor} />}
                                                       </>
                                                  );
                                             }}
                                        </AccordionTrigger>
                                   </AccordionHeader>
                                   <AccordionContent bgColor={colorMode === 'light' ? theme['colors']['coolGray']['100'] : theme['colors']['coolGray']['700']}>
                                        <AccordionContentText>
                                             <Text
                                                  style={{
                                                       fontFamily: 'Courier New, monospace',
                                                       fontSize: 12,
                                                       whiteSpace: 'pre-wrap',
                                                       color: textColor,
                                                  }}>
                                                  {(() => {
                                                       try {
                                                            const parsed = JSON.parse(item.response_body);
                                                            return JSON.stringify(parsed, null, 2);
                                                       } catch (error) {
                                                            return JSON.stringify(item.response_body, null, 2);
                                                       }
                                                  })()}
                                             </Text>
                                        </AccordionContentText>
                                   </AccordionContent>
                              </AccordionItem>
                         </Accordion>
                    ) : null}
               </VStack>
          </Box>
     );

     return (
          <Box flex={1}>
               <Box px="$3" py="$3" borderBottomWidth={1} borderColor="$borderLight200">
                    <Heading size="sm" color={textColor}>
                         {getTermFromDictionary(language, 'api_error_log')}
                    </Heading>
                    <Text size="xs" color={textColor}>
                         {getTermFromDictionary(language, 'total') + ': ' + meta.total}
                    </Text>
               </Box>

               {loading && rows.length === 0 ? (
                    <Box flex={1} alignItems="center" justifyContent="center">
                         <Spinner />
                    </Box>
               ) : (
                    <FlatList
                         data={rows}
                         keyExtractor={(item) => String(item.id)}
                         renderItem={renderEntry}
                         ListEmptyComponent={
                              <Box px="$3" py="$6" alignItems="center">
                                   <Text>{getTermFromDictionary(language, 'api_error_log_empty')}</Text>
                              </Box>
                         }
                    />
               )}

               <HStack px="$3" py="$3" justifyContent="space-between" alignItems="center" borderTopWidth={1} borderColor="$borderLight200">
                    <Button bgColor={theme['colors']['secondary']['500']} onPress={() => loadPage(page - 1)} isDisabled={loading || !meta.hasPrevious}>
                         <ButtonText color={theme['colors']['secondary']['500-text']}>{getTermFromDictionary(language, 'previous')}</ButtonText>
                    </Button>

                    <Text size="xs" color={textColor}>{`Page ${page} / ${meta.totalPages}`}</Text>

                    <Button bgColor={theme['colors']['secondary']['500']} onPress={() => loadPage(page + 1)} isDisabled={loading || !meta.hasMore}>
                         <ButtonText color={theme['colors']['secondary']['500-text']}>{getTermFromDictionary(language, 'next')}</ButtonText>
                    </Button>
               </HStack>

               <Box px="$3" pb="$3">
                    <Button variant="outline" borderColor={theme['colors']['tertiary']['500']} onPress={onClear} isDisabled={loading}>
                         <ButtonText color={theme['colors']['tertiary']['500']}>{getTermFromDictionary(language, 'clear_api_error_log')}</ButtonText>
                    </Button>
               </Box>
          </Box>
     );
};

/**
 * Generate a preview string for a value, truncating if it exceeds the specified max length.
 * @param value
 * @param max
 * @returns {string|string|string}
 */
function preview(value, max = 200) {
     if (value == null) return '';
     const s = typeof value === 'string' ? value : JSON.stringify(value);
     return s.length > max ? `${s.slice(0, max)}...` : s;
}
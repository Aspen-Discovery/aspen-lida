import React, {useState} from 'react';
import {SafeAreaView} from 'react-native';
import {Button, Center, Modal, HStack, Text, Icon, FlatList, Heading} from 'native-base';
import {MaterialIcons} from '@expo/vector-icons';
import {getItemDetails} from '../../util/recordActions';
import _ from 'lodash';
import {LanguageContext, LibrarySystemContext} from '../../context/initialContext';
import {useQueryClient} from '@tanstack/react-query';
import {getTermFromDictionary} from '../../translations/TranslationService';

/*const CopyDetails = (props) => {
 const { library } = React.useContext(LibrarySystemContext);
 const [open, setOpen] = React.useState(false);
 const toggleModal = () => {
 setOpen(!open);
 };
 const [loading, setLoading] = React.useState(false);
 };*/

const ShowItemDetails = (props) => {
     const {library} = React.useContext(LibrarySystemContext);
     const {language} = React.useContext(LanguageContext);
     const queryClient = useQueryClient();
     const {
          data,
          title,
          id,
          format,
          libraryUrl,
          copyDetails,
          discoveryVersion
     } = props;
     const [showModal, setShowModal] = useState(false);
     const [details, setDetails] = React.useState('');
     const [shouldFetch, setShouldFetch] = React.useState(true);
     const loading = React.useCallback(() => setShouldFetch(true), []);

     let copies = copyDetails;

     if (discoveryVersion <= '22.12.01') {
          let copies = [];
          if (copyDetails) {
               _.map(copyDetails, function(copy, index, array) {
                    copy = {
                         id: index,
                         totalCopies: copy.totalCopies,
                         availableCopies: copy.availableCopies,
                         shelfLocation: copy.shelfLocation,
                         callNumber: copy.callNumber,
                    };
                    copies = _.concat(copies, copy);
               });
          }
     }

     if (discoveryVersion <= '22.09.01') {
          React.useEffect(() => {
               if (!loading) {
                    return;
               }

               const loadItemDetails = async () => {
                    if (typeof id !== 'undefined' && format !== null) {
                         await getItemDetails(libraryUrl, id, format).then((response) => {
                              setShouldFetch(false);
                              setDetails(response);
                         });
                    }
               };
               loadItemDetails();
          }, [loading]);

          return (
              <SafeAreaView>
                   <Center>
                        <Button
                            onPress={() => {
                                 getItemDetails(libraryUrl, id, format).then((response) => {
                                      setDetails(response);
                                      setShowModal(true);
                                 });
                            }}
                            colorScheme="tertiary"
                            variant="ghost"
                            size="sm"
                            leftIcon={<Icon as={MaterialIcons} name="location-pin" size="xs" mr="-1"/>}>
                             {getTermFromDictionary(language, 'where_is_it')}
                        </Button>

                        <Modal isOpen={showModal} onClose={() => setShowModal(false)} size="full">
                             <Modal.Content maxWidth="90%" bg="white" _dark={{bg: 'coolGray.800'}}>
                                  <Modal.CloseButton/>
                                  <Modal.Header>
                                       <HStack>
                                            <Icon as={MaterialIcons} name="location-pin" size="xs" mt=".5" pr={5}/>
                                            <Heading size="sm">{getTermFromDictionary(language, 'where_is_it')}</Heading>
                                       </HStack>
                                  </Modal.Header>
                                  <Modal.Body>
                                       <FlatList data={details} keyExtractor={(item) => item.description} ListHeaderComponent={renderHeader()} renderItem={({item}) => renderCopyDetails(item)}/>
                                  </Modal.Body>
                             </Modal.Content>
                        </Modal>
                   </Center>
              </SafeAreaView>
          );
     } else {
          return (
              <SafeAreaView>
                   <Center>
                        <Button onPress={() => setShowModal(true)} colorScheme="tertiary" variant="ghost" size="sm" leftIcon={<Icon as={MaterialIcons} name="location-pin" size="xs" mr="-1"/>}>
                            {getTermFromDictionary(language, 'where_is_it')}
                        </Button>

                        <Modal isOpen={showModal} onClose={() => setShowModal(false)} size="full">
                             <Modal.Content maxWidth="90%" bg="white" _dark={{bg: 'coolGray.800'}}>
                                  <Modal.CloseButton/>
                                  <Modal.Header>
                                       <HStack>
                                            <Icon as={MaterialIcons} name="location-pin" size="xs" mt=".5" pr={5}/>
                                            <Heading size="sm">{getTermFromDictionary(language, 'where_is_it')}</Heading>
                                       </HStack>
                                  </Modal.Header>
                                  <Modal.Body>
                                       <FlatList data={copies} ListHeaderComponent={renderHeader()} renderItem={({item}) => renderCopyDetails(item)} keyExtractor={(item, index) => index.toString()}/>
                                  </Modal.Body>
                             </Modal.Content>
                        </Modal>
                   </Center>
              </SafeAreaView>
          );
     }
};

const renderHeader = () => {
    const {language} = React.useContext(LanguageContext);
     return (
         <HStack space={4} justifyContent="space-between" pb={2}>
              <Text bold w="30%" fontSize="xs">
                  {getTermFromDictionary(language, 'available_copies')}
              </Text>
              <Text bold w="30%" fontSize="xs">
                  {getTermFromDictionary(language, 'location')}
              </Text>
              <Text bold w="30%" fontSize="xs">
                  {getTermFromDictionary(language, 'call_num')}
              </Text>
         </HStack>
     );
};

const renderCopyDetails = (item) => {
     //console.log(item);
     return (
         <HStack space={4} justifyContent="space-between">
              <Text w="30%" fontSize="xs">
                   {item.availableCopies} of {item.totalCopies}
              </Text>
              <Text w="30%" fontSize="xs">
                   {item.shelfLocation}
              </Text>
              <Text w="30%" fontSize="xs">
                   {item.callNumber}
              </Text>
         </HStack>
     );
};

export default ShowItemDetails;
import React, { Component } from 'react';
import { 
  Platform, 
  StyleSheet, 
  Text, 
  View,
  Share,
  TextInput,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  SafeAreaView,
  Image } 
from 'react-native';
import { createAppContainer } from 'react-navigation';
import { createStackNavigator } from 'react-navigation-stack';
import {KeyboardAvoidingView} from 'react-native';

import FontAwesomeIcon from 'react-native-vector-icons/FontAwesome';
import { Sae } from 'react-native-textinput-effects';
import { 
  Notifications,
  Linking } 
from 'expo';
import * as Permissions from 'expo-permissions';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

import Geocoder from 'react-native-geocoding';
import QRCode from 'react-native-qrcode';
import Modal from 'react-native-modal';

// TaskManager.defineTask('listen-location', ({data: { locations}, error }) => {
//   if (error) {
//     return;
//   }
//   console.log("received new locations", locations);
//   // user_location = locations;
// });

const instructions = Platform.select({
  ios: 'Press Cmd+R to reload,\n' + 'Cmd+D or shake for dev menu',
  android: 'Double tap R on your keyboard to reload,\n' + 'Shake or press menu button for dev menu',
});

const Emoji = props => (
  <Text
      className="emoji"
      role="img"
      aria-label={props.label ? props.label : ""}
      aria-hidden={props.label ? "false" : "true"}
  >
      {props.symbol}
  </Text>
);

class StartScreen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      url: Linking.makeUrl(),
      group_code: '',
    };
  }

  componentDidMount() {
    let scheme = 'nxet'
    Linking.getInitialURL()
            .then(url => this.handleOpenURL({ url }))
            .catch(console.error);
    Linking.addEventListener('url', this.handleOpenURL);
  }

  handleOpenURL = (event) => {
    console.log("handling");
    console.log(event.url);
    const route = event.url.replace(/.*?:\/\//g, '');
    const routeName = route.split('/');
    if (routeName.length > 1) {
      const group_code = routeName[routeName.length - 1];
      console.log(group_code)
      this.setState({group_code: group_code});
      console.log(this.state.group_code);
      this.props.navigation.navigate('JoinGroup', this.state)
    }
  }

  componentWillUnmount() {
    Linking.removeEventListener('url', this.handleOpenURL);
  }

  render() {
    let logo = require('./assets/logo_name.png');
    return (
      <View style={styles.container}>
        <View style={styles.logo}>
          <Image source={logo} style={{ width: 320, height: 115 }} />
        </View>

        <Text style={styles.instructions}>Keeping you and your friends safe and connected!</Text>
        <TouchableOpacity onPress={() => this.props.navigation.navigate('CreateGroup', this.state)} style={styles.button}>
          <Text style={styles.buttonText}>Create Group</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => this.props.navigation.navigate('JoinGroup', this.state)} style={styles.button}>
          <Text style={styles.buttonText}>Join Group</Text>
        </TouchableOpacity>
        
      </View>
    );
  }
}

class CreateGroupScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      name: '',
      group_code: '',
      device_id: Expo.Constants.sessionId,
      push_id: '',
      address: '',
      home_location: null,
    };
  }

  componentDidMount() {
    // deviceregisterForPushNotificationsAsync()
    this.registerForPushNotificationsAsync().then(x => { 
      push_id = x;
      this.setState({push_id: push_id});
    })
  }

  async registerForPushNotificationsAsync() {
    const { status } = await Permissions.askAsync(Permissions.NOTIFICATIONS);
    // only asks if permissions have not already been determined, because
    // iOS won't necessarily prompt the user a second time.
    // On Android, permissions are granted on app installation, so
    // `askAsync` will never prompt the user

    // Stop here if the user did not grant permissions
    if (status !== 'granted') {
      alert('No notification permissions!');
      return;
    }

    // Get the token that identifies this device
    let token = await Notifications.getExpoPushTokenAsync();
    console.log(token)

    // POST the token to your backend server from where you can retrieve it to send push notifications.
    return token;
  }

  requestGroupCode = () => {
    // this._getLocationAsync();
    // api call
    const PUSH_ENDPOINT = 'https://.../dev/create';
    let new_group_code = ''
    fetch(PUSH_ENDPOINT, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        device_id: this.state.device_id,
        name: this.state.name,
        push_id: this.state.push_id
      }),
    })
    .then(response => response.json())
    .then(data => {
      new_group_code = data['group_code'];
      this.setState({group_code: new_group_code})
      console.log(this.state)
      this.props.navigation.navigate('Main', this.state);
    });
  }

  _getLocationAsync = async (address) => {
    let { status } = await Permissions.askAsync(Permissions.LOCATION);
    if (status !== 'granted') {
      this.setState({
        errorMessage: 'Permission to access location was denied',
      });
    }
    try {
      let home_location = await Location.geocodeAsync(address);
      this.setState({ home_location });
    } catch (e) {
      console.log(e);
    }
  };

  render() {
    return (
      <KeyboardAvoidingView style={styles.container} behavior="padding" enabled>
        {/* <Sae
          label={'Group Name'}
          labelStyle={{color: '#4DD0E1'}}
          iconClass={FontAwesomeIcon}
          iconName={'pencil'}
          iconColor={'#A7A7A7'}
          inputStyle={{color: 'black'}}
          onChangeText={(group_name) => this.setState({group_name})}
        /> */}
        <Sae
          label={'Your Name'}
          labelStyle={{color: '#4DD0E1'}}
          iconClass={FontAwesomeIcon}
          iconName={'pencil'}
          iconColor={'#A7A7A7'}
          inputStyle={{color: 'black'}}
          onChangeText={(name) => this.setState({name})}
        />
        <Sae
          label={'Home Address'}
          labelStyle={{color: '#4DD0E1'}}
          iconClass={FontAwesomeIcon}
          iconName={'pencil'}
          iconColor={'#A7A7A7'}
          inputStyle={{color: 'black'}}
          onChangeText={(address) => this._getLocationAsync(address)}
          style={{marginBottom: 30}}
        />

        <TouchableOpacity onPress={this.requestGroupCode} style={styles.button}>
          <Text style={styles.buttonText}>Create Group</Text>
        </TouchableOpacity>  

      </KeyboardAvoidingView>
    );
  }
}

class JoinGroupScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      name: '',
      group_code: '',
      device_id: Expo.Constants.sessionId,
      push_id: '',
      address: '',
    };
    console.log(props.navigation.state)
    if (props.navigation.state.params.hasOwnProperty('group_code')) {
      console.log("group code from link")
      console.log(props.navigation.state.params.group_code)
      this.state = {
        name: '',
        group_code: props.navigation.state.params.group_code,
        device_id: Expo.Constants.sessionId,
        push_id: '',
        address: '',
      };
    }
    console.log(this.state)
  }

  componentDidMount() {
    // deviceregisterForPushNotificationsAsync()
    console.log(this.state.group_code)
    push_id = ''
    this.registerForPushNotificationsAsync().then(x => { 
      console.log("mount")
      console.log(x)
      push_id = x;
      this.setState({push_id: push_id});
    })
    // let scheme = 'nxet'
    // Linking.getInitialURL()
    // .then(url => {
    //   console.log("App.js getInitialURL Triggered")
    //   // this.handleOpenURL({ url });
    // })
    // .catch(error => console.error(error));
    
  }

  // handleOpenURL() {
  //   const initialUrl = await Linking.getInitialURL();

  //   if (initialUrl) {
  //     this.handleDeepLink({ url: initialUrl });
  //   }
  //   console.log('handling')
  //   const item = this.props.navigation.getParam('item', {});
    
  //   console.log(item)
  //   let { path, queryParams } = Linking.parse(url);
  //   console.log(path)
  // }

  async registerForPushNotificationsAsync() {
    const { status } = await Permissions.askAsync(Permissions.NOTIFICATIONS);
    // only asks if permissions have not already been determined, because
    // iOS won't necessarily prompt the user a second time.
    // On Android, permissions are granted on app installation, so
    // `askAsync` will never prompt the user

    // Stop here if the user did not grant permissions
    if (status !== 'granted') {
      alert('No notification permissions!');
      return;
    }

    // Get the token that identifies this device
    let token = await Notifications.getExpoPushTokenAsync();
    console.log("register")
    console.log(token)

    // POST the token to your backend server from where you can retrieve it to send push notifications.
    return token;
  }

  submitGroupCode = () => {
    // api call
    console.log("hello")
    const PUSH_ENDPOINT = 'https://.../dev/join';
    fetch(PUSH_ENDPOINT, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        group_code: this.state.group_code,
        device_id: this.state.device_id,
        name: this.state.name,
        push_id: this.state.push_id
      }),
    })
    .then(response => response.json())
    .then(data => {
      // new_group_code = data['group_code'];
      // this.setState({group_code: new_group_code})
      // console.log(data)
      console.log(JSON.stringify({
        group_code: this.state.group_code,
        device_id: this.state.device_id,
        name: this.state.name,
        push_id: this.state.push_id
      }))
      this.props.navigation.navigate('Main', this.state);
    }
    );
  }

  _getLocationAsync = async (address) => {
    let { status } = await Permissions.askAsync(Permissions.LOCATION);
    if (status !== 'granted') {
      this.setState({
        errorMessage: 'Permission to access location was denied',
      });
    }
    try {
      let home_location = await Location.geocodeAsync(address);
      this.setState({ home_location });
    } catch (e) {
      console.log(e);
    }
  };

  render() {
    return (
      <KeyboardAvoidingView style={styles.container} behavior="padding" enabled>
        <Sae
          label={'Group Code'}
          iconClass={FontAwesomeIcon}
          labelStyle={{color: '#4DD0E1'}}
          iconName={'pencil'}
          iconColor={'#A7A7A7'}
          inputStyle={{color: 'black'}}
          value={this.state.group_code}
          onChangeText={(group_code) => this.setState({group_code})}
        />
        <Sae
          label={'Your Name'}
          labelStyle={{color: '#4DD0E1'}}
          iconClass={FontAwesomeIcon}
          iconName={'pencil'}
          iconColor={'#A7A7A7'}
          inputStyle={{color: 'black'}}
          onChangeText={(name) => this.setState({name})}
        />
        <Sae
          label={'Home Address'}
          labelStyle={{color: '#4DD0E1'}}
          iconClass={FontAwesomeIcon}
          iconName={'pencil'}
          iconColor={'#A7A7A7'}
          inputStyle={{color: 'black'}}
          onChangeText={(address) => this._getLocationAsync(address)}
          style={{marginBottom: 30}}
        />

        <TouchableOpacity onPress={this.submitGroupCode} style={styles.button}>
          <Text style={styles.buttonText}>Join Group {this.state.group_code}</Text>
        </TouchableOpacity>  

      </KeyboardAvoidingView>
    );
  }
}

class MainScreen extends React.Component {

  constructor(props) {
    super(props);
    console.log(props.navigation);
    let home_loc_test = {
      "latitude": 42.208,
      "longitude": -87.953
    }
    this.state = {
      loggedIn: {name: props.navigation.state.params.name, home_location: props.navigation.state.params.home_location, device_id: props.navigation.state.params.device_id, push_id: props.navigation.state.params.push_id},
      // loggedIn: {name: props.navigation.state.params.name, home_location: home_loc_test, device_id: props.navigation.state.params.device_id},
      members: [],
      groupCode: props.navigation.state.params.group_code,
      // groupName: 'friday night!',
      // created: '1023948120',
      refreshing: false,
      user_location: null,
      url: Linking.makeUrl('/join/'+ props.navigation.state.params.group_code.toString()),
      swipe_to_refresh: true,
      is_modal_visible: false,
    };
    console.log("from")
    console.log(this.state.url)
    // this.registerForLocationsAsync();;
  }

  async componentDidMount() {
    console.log("mount main")

    const { status } = await Permissions.askAsync(Permissions.LOCATION);
    if (status === "granted") {
      // this._getLocationAsync();
    } else {
      this.setState({ error: "Locations services needed" });
    }
    this.getApiData()
  }

  // async registerForLocationsAsync() {
  //   const { status } = await Permissions.askAsync(Permissions.LOCATION);
  //   // only asks if permissions have not already been determined, because
  //   // iOS won't necessarily prompt the user a second time.
  //   // On Android, permissions are granted on app installation, so
  //   // `askAsync` will never prompt the user

  //   // Stop here if the user did not grant permissions
  //   if (status !== 'granted') {
  //     alert('No location permissions!');
  //     return;
  //   }

  //   let current = await Location.startLocationUpdatesAsync('listen-location', {
  //     accuracy: Location.Accuracy.Balanced,
  //     timeInterval: 300,
  //     distanceInterval: 0
  //   });

  //   console.log("current location");
  //   console.log(current);

  //   let location = await Location.getCurrentPositionAsync({});
  //   this.setState({ user_location: location })
  //   console.log("async location");
  //   console.log(this.state.user_location);
  // }

  _getLocationAsync = async () => {
    this.location = await Location.startLocationUpdatesAsync('listen-location', {
      enableHighAccuracy: true,
      distanceInterval: 0,
      timeInterval: 100
    },
      newLocation => {
        let { coords } = newLocation;
        console.log("updated location")
        let region = {
          latitude: coords.latitude,
          longitude: coords.longitude,
        };
        this.setState({ user_location: region });
        console.log(this.state);
      },
      error => console.log(error)
    );
    return this.location;
    // watchPositionAsync Return Lat & Long on Position Change
    // this.location = await Location.watchPositionAsync(
    //   {
    //     // enableHighAccuracy: true,
    //     distanceInterval: 0,
    //     timeInterval: 10
    //   },
    //   newLocation => {
    //     let { coords } = newLocation;
    //     console.log("updated location")
    //     let region = {
    //       latitude: coords.latitude,
    //       longitude: coords.longitude,
    //     };
    //     this.setState({ user_location: region });
    //     console.log(this.state)
    //     if 
    //   },
    //   error => console.log(error)
    // );
    // return this.location;
  };

  _getForegroundLocationAsync = async () => {
    let { status } = await Permissions.askAsync(Permissions.LOCATION);
    if (status !== 'granted') {
      this.setState({errorMessage: 'Permission to access location was denied'});
    }
    let user_location = await Location.getCurrentPositionAsync({});
    this.setState({ user_location });
  }
  
  getApiData = () => {
    const request = new Request('https://.../dev?group_code=' + this.state.groupCode);
    const URL = request.url;
    const method = request.method;
    fetch(request)
    .then((response) => {
      if (!response.ok) throw Error(response.statusText);
      return response.json();
    })
    .then((data) => {
        var new_members_state = []
        // console.log(this.state.loggedIn.device_id)
        console.log(data)
        data["group_members"].forEach(addMember);
        function addMember(item, index) {
          console.log(item)
          var is_home = false;
          console.log(item["push_id"]);
          if (item["is_home"] === "true") {
            is_home = true;
          }
          var dict = {
            name: item["name"],
            isHome: is_home,
            push_token: item["push_id"],
          }
          // if (item["device_id"] !== this.state.loggedIn.device_id) 
          new_members_state.push(dict)
        };
        console.log(new_members_state);
        this.setState({members: new_members_state})
        // console.log(this.state)

        return "***"
//      if (response.status === 200) {
//
//              response.json().then(function(data) {
//                                   this.setState({groupCode: data["group_code"]})
//                console.log(data["group_code"]);
//                return "**"
//              });
//            } else {
//              return "****"
//              throw new Error('Something went wrong on api server!');
//              return "****"
//            }
    })
    .then(response => {
      console.debug(response);
      // ...
    }).catch(error => {
      console.error(error);
    });
  }

  // handlePushNotifications = (message) => {
  //   let notifications = [];
  //   let savedPushTokens = [];
  //   this.state.members.map(function(member, index) { savedPushTokens.push(member.push_token) });
  //   for (let pushToken of savedPushTokens) {
  //     if (!Expo.isExpoPushToken(pushToken)) {
  //       console.error(`Push token ${pushToken} is not a valid Expo push token.`);
  //       continue;
  //     }
  //     notifications.push({
  //       to: pushToken,
  //       sound: 'default',
  //       title: 'Message received!',
  //       body: message,
  //       data: { message },
  //     })
  //   }

  //   let chunks = Expo.chunkPushNotifications(notification);
  //   let tickets = [];
  //   (async () => {
  //     for (let chunk of chunks) {
  //       try {
  //         let ticketChunk = await Expo.sendPushNotifiationsAsync(chunk);
  //         console.log(ticketChunk);
  //         tickets.push(...ticketChunk);

  //       } catch (error) {
  //         console.error(error);
  //       }
  //     }
  //   })();
  // }

  checkIfWithinRange = async () => {
    console.log("checking if arrived home...");
    console.log(this.state);
    // console.log(this.state.user_location)
    console.log(Math.abs(this.state.loggedIn.home_location[0]["latitude"] - this.state.user_location["coords"]["latitude"]))
    if (Math.abs(this.state.loggedIn.home_location[0]["latitude"] - this.state.user_location["coords"]["latitude"]) < 0.001
    && Math.abs(this.state.loggedIn.home_location[0]["longitude"] - this.state.user_location["coords"]["longitude"]) < 0.001) {
      // Post if user is home
      console.log("near home location");
      // this.state.members.map(function(member, index) {
      //    if (member.name === this.state.loggedIn.name) {
          //Update is_home POST request
      const request = new Request('https://.../dev');
      console.log(this.state)
      const body = JSON.stringify({
        group_code: this.state.groupCode,
        device_id: this.state.loggedIn.device_id,
        is_home: "true"
      })
      console.log(body)
      fetch(request, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          group_code: this.state.groupCode,
          device_id: this.state.loggedIn.device_id,
          is_home: "true"
        }),
      })
      .then((response) => {
        console.log("got response");
        if (!response.ok) throw Error(response.statusText);
        return response.json();
      })
      .catch(error => {
        console.error(error);
      });
    }
  }

  findCurrentLocationAsync = async () => {
    let { status } = await Permissions.askAsync(Permissions.LOCATION);

    if (status !== 'granted') {
      this.setState({
        errorMessage: 'Permission to access location denied'
      });
    }
    let user_location = await Location.getCurrentPositionAsync({});
    this.setState({ user_location })
  }
  
  onRefresh = () => {
//    this.fetchData.then(() => {
//      this.setState({refreshing: false});
//    });
    // Check if the new user location is within range of the home, update if user is home.
    //this.setState({refreshing: true}, function() { this.getApiData() });
    // console.log('location?')
    // this._getForegroundLocationAsync()
    // Location.getCurrentPositionAsync(Location.Accuracy.High)
    this.findCurrentLocationAsync().then(() => {
      console.log('location? 1')
      console.log(this.state.user_location)
    })
    .then(() => {
      console.log('checking if home?')
      this.checkIfWithinRange();
    })
    .then(() => {
      this.setState({refreshing: true}, function() { this.getApiData() });
    })
    .then(() => {
      this.setState({refreshing: false});
    });

    this.setState({
      swipe_to_refresh: false,
    });

      //Set and send notifications
      // this.handlePushNotifications(JSON.stringify(this.state.loggedIn.name) + " has arrived home!");

    // Get api data
    // this.setState({refreshing: true}, function() { this.getApiData() });
    
  }
  ShareMessage = () => {
    //Here is the Share API 
    Share.share({
      message: this.state.groupCode.toString(),
      url: Linking.makeUrl('/join/'+ this.state.groupCode.toString())
    })
    //after successful share return result
    .then(result => console.log(result))
    //If any thing goes wrong it comes here
    .catch(errorMsg => console.log(errorMsg));
  };

  toggleModal = () => {
    this.setState({
      is_modal_visible: !this.state.is_modal_visible,
    });
  }

  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.groupInfo}>
          <Text style={{fontWeight: 'bold', color: '#4DD0E1'}}>
            Group Code:&nbsp;
          </Text> 
          <Text onPress={this.ShareMessage}>{this.state.groupCode}&nbsp;<FontAwesomeIcon name="link" size={26}/></Text>
          {/* <Text style={{fontWeight: 'bold', color: '#4DD0E1'}}>
            Group Name: 
          </Text> {this.state.groupName}{"\n"}
          <Text style={{fontWeight: 'bold', color: '#4DD0E1'}}>
            Created: 
          </Text> {this.state.created} */}
          &nbsp;<FontAwesomeIcon name="qrcode" size={26} onPress={this.toggleModal}/>
        </Text>
        
        {/* <TouchableOpacity onPress={this.ShareMessage} style={styles.shareButton}>
            <Text style={styles.buttonText}>Share Code</Text>
        </TouchableOpacity> */}

        <View style={{
            marginTop: 10,
            borderBottomColor: '#404d5b',
            borderBottomWidth: 0.5,
            width: '100%'
          }}
        />

        {/* <Text style={styles.groupInfo}>
          <Text style={{fontWeight: 'bold', color: '#4DD0E1'}}>
            My Info:
          </Text>
        </Text>
        <View style={styles.entry}>
          <View style={{flexDirection:"row"}}>
            <Text style={{justifyContent: 'flex-start'}}>
              <Text style={{fontSize: 20, fontWeight: 'bold'}}>{this.state.loggedIn.name}</Text>
              <Text>{'\n'}updated now{'\n'}</Text>
              <Text style={{fontWeight: 'bold'}}>{'\n'}Home Address:</Text>
              <Text> {this.state.loggedIn.location}</Text>
            </Text>
          </View>
        </View> */}

        <Text style={styles.groupInfo}>
          <Text style={{fontWeight: 'bold', color: '#4DD0E1'}}>
            Group Members:
          </Text>
        </Text>

        <Modal isVisible={this.state.is_modal_visible}>
            <View style={{justifyContent: 'center', alignItems: 'center', paddingTop: 200}}>
              {<QRCode value={this.state.url} size={250}/>}
            </View>
              {<TouchableOpacity style={styles.container} activeOpacity={1} onPress={this.toggleModal}>
                <Text style={styles.buttonText}>click anywhere to hide QR code</Text>
              </TouchableOpacity>}
        </Modal>

        <ScrollView refreshControl={
          <RefreshControl refreshing={this.state.refreshing} onRefresh={this.onRefresh} />
        }>
          {this.state.swipe_to_refresh ?
            <Text style={styles.swipeInfo}>
            Swipe down to refresh...
            </Text> : null
          }
          {this.state.members.map(function(member, index){
            return (
              <View style={styles.entry}>
                <View style={{flexDirection:"row", justifyContent: 'space-between'}}>
                  <Text style={{justifyContent: 'flex-start'}} key={index}>
                    <Text style={{fontSize: 20, fontWeight: 'bold'}}>{member.name}</Text>
                    <Text>{'\n'}updated now</Text>
                  </Text>
                  {member.isHome ? (<Text style={styles.emoji}><Emoji symbol="🏠" label="Home"/></Text>) : (null)}
                </View>
              </View>
            )
          })
          }
        </ScrollView>

        <TouchableOpacity onPress={() => this.props.navigation.navigate('Start')} style={styles.button}>
          <Text style={styles.buttonText}>Leave Group</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'stretch',
    textAlign: 'center',
    marginHorizontal: 25,
    marginTop: 60,
    marginBottom: 25
    //backgroundColor: 'purple'
  },
  logo: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
  button: {
    backgroundColor: '#4DD0E1', 
    padding: 20,
    borderRadius: 5,
    marginTop: 10,
    marginBottom: 10,
  },
  buttonText: {
    fontSize: 20,
    textAlign: 'center',
    color: '#fff',
  },
  title: {
    paddingBottom: 0,
    textAlign: 'center',
    color: '#404d5b',
    fontSize: 30,
    fontWeight: 'bold',
    opacity: 0.8,
  },
  entry: {
    padding: 20,
    marginTop: 10,
    borderColor: '#404d5b',
    borderWidth: 0.5,
    borderRadius: 5,
    // backgroundColor: 'blue'
  },
  groupInfo: {
    paddingTop: 16,
    textAlign: 'left',
    color: '#404d5b',
    fontSize: 26,
    opacity: 0.8,
    borderBottomWidth: 5,
  },
  swipeInfo: {
    paddingTop:10,
    textAlign: 'center',
    fontSize: 12,
  },
  emoji: {
    fontSize: 35,
    marginRight: 15,
    textAlign: 'right',
  },
  shareButton: {
    backgroundColor: '#4DD0E1', 
    padding: 20,
    borderRadius: 5,
    marginTop: 10,
    marginBottom: 10,
  }
});

const RootStack = createStackNavigator(
  {
    Start: {
      screen: StartScreen,
      navigationOptions: {
        title: 'Start',
        headerShown: false,
      },
      path: 'start',
    },
    JoinGroup: {
      screen: JoinGroupScreen,
      navigationOptions: {
        title: 'Join Group',
        headerStyle: {
          backgroundColor: 'white',
        },
      },
      path: 'join/:groupCode',
    },
    CreateGroup: {
      screen: CreateGroupScreen,
      navigationOptions: {
        title: 'Create Group',
      },
      path: 'create',
    },
    Main: {
      screen: MainScreen,
      navigationOptions: {
        title: 'Main',
        headerShown: false,
      },
      path: 'main',
    },
  },
  {
    initialRouteName: 'Start',
  }
);

const AppContainer = createAppContainer(RootStack);

export default () => {
  const prefix = Linking.makeUrl("/");
  console.log(prefix);
  return <AppContainer uriPrefix={prefix} />;
};

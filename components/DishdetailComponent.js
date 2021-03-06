import React, { Component } from "react";
import { StyleSheet, Text, View, ScrollView, FlatList, Modal, Button, Alert, PanResponder, Share } from "react-native";
import { Rating, AirbnbRating, Card, Icon, Input } from "react-native-elements";
import { DISHES } from "../shared/dishes";
import { COMMENTS } from "../shared/comments";
import { connect } from 'react-redux';
import { baseUrl } from '../shared/baseUrl';
import { postFavorite } from '../redux/ActionCreators';
import { postComment } from '../redux/ActionCreators';
import * as Animatable from 'react-native-animatable';

const mapStateToProps = state => {
  return {
    dishes: state.dishes,
    comments: state.comments,
    favorites: state.favorites,
    comments: state.comments
  }
}
const mapDispatchToProps = dispatch => ({
  postFavorite: (dishId) => dispatch(postFavorite(dishId)),
  postComment: (dishId, rating, author, comment) => dispatch(postComment(dishId, rating, author, comment))
})

function RenderDish(props) {
  const dish = props.dish;

  // PANRESPONDER FOR GESTURE
  var viewRef;
  const handleViewRef = ref => viewRef = ref;

  const recognizeDrag = ({ moveX, moveY, dx, dy }) => {
    if (dx < -200)
      return true;
    else
      return false;
  }
  const recognizeComment = ({ moveX, moveY, dx, dy }) => {
    if (dx > 200)
      return true;
    else
      return false;
  }
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: (e, gestureState) => {
      return true;
    },
    // For the Rubberband effect on the card bcoz of our gesture.
    onPanResponderGrant: () => {
      viewRef.rubberBand(1000)
        .then(endState => console.log(endState.finished ? 'finished' : 'cancelled'));
    },
    onPanResponderEnd: (e, gestureState) => {
      console.log("pan responder end", gestureState);
      if (recognizeDrag(gestureState))
        Alert.alert(
          'Add Favorite',
          'Are you sure you wish to add ' + dish.name + ' to favorite?',
          [
            { text: 'Cancel', onPress: () => console.log('Cancel Pressed'), style: 'cancel' },
            { text: 'OK', onPress: () => { props.favorite ? console.log('Already favorite') : props.onPress() } },
          ],
          { cancelable: false }
        );
      else if (recognizeComment(gestureState))
        props.toggle();

      return true;
    }
  })
  // PANRESPONDER  (for gesture) FUNCTIONS DONE

  // FOR SHARING VIA ANY APP (SHARE API FROM REACT NATIVE)
  const shareDish = (title, message, url) => {
    Share.share({
      title: title,
      message: title + ': ' + message + ' ' + url,
      url: url
    }, {
      dialogTitle: 'Share ' + title
    })
  }

  if (dish != null) {
    return (
      <Animatable.View animation="fadeInDown" duration={2000} delay={1000}
        ref={handleViewRef}
        {...panResponder.panHandlers}>
        <Card
          featuredTitle={dish.name}
          image={{ uri: baseUrl + dish.image }}
        >
          <Text style={{ margin: 10 }}>{dish.description}</Text>
          <View style={{ flexDirection: "row" }}>
            <View style={{ flex: 1, alignItems: "flex-end" }}>
              <Icon
                raised
                reverse
                name={props.favorite ? 'heart' : 'heart-o'}
                type='font-awesome'
                color='#f50'
                onPress={() => props.favorite ? console.log('Already favorite') : props.onPress()}
              />
            </View>
            <View style={{ flex: 1, alignItems: "flex-start" }}>
              <Icon
                raised
                reverse
                name='pencil'
                type='font-awesome'
                color='#512DA8'
                onPress={() => props.toggle()}
              />
            </View>
            <View style={{ flex: 1, alignItems: "flex-start" }}>
              <Icon
                raised
                reverse
                name='share'
                type='font-awesome'
                color='#51D2A8'
                style={styles.cardItem}
                onPress={() => shareDish(dish.name, dish.description, baseUrl + dish.image)} />
            </View>
          </View>
        </Card>
      </Animatable.View>
    );
  } else {
    return <View></View>;
  }
}

function RenderComments(props) {

  const comments = props.comments;

  const renderCommentItem = ({ item, index }) => {

    return (
      <View key={index} style={{ margin: 10 }}>
        <Text style={{ fontSize: 14 }}>{item.comment}</Text>
        <Text style={{ fontSize: 12 }}>{item.rating} Stars</Text>
        <Text style={{ fontSize: 12 }}>{'-- ' + item.author + ', ' + item.date} </Text>
      </View>
    );
  };

  return (
    <Animatable.View animation="fadeInUp" duration={2000} delay={1000}>
      <Card title='Comments' >
        <FlatList
          data={comments}
          renderItem={renderCommentItem}
          keyExtractor={item => item.id.toString()}
        />
      </Card>
    </Animatable.View>
  );
}

class Dishdetail extends Component {
  constructor(props) {
    super(props);
    this.state = {
      //dishes: DISHES,
      //comments: COMMENTS,
      favorites: [],
      showModal: false,
      rating: 1,
      author: "",
      comment: "",
    };
  }
  toggleModal() {
    this.setState({ showModal: !this.state.showModal });
  }
  markFavorite(dishId) {
    this.props.postFavorite(dishId);
  }
  handleComment(dishId, rating, author, comment) {
    //DISPATCH TO THE STORE
    this.props.postComment(dishId, rating, author, comment);
    this.toggleModal();
  }


  static navigationOptions = {
    title: "Dish Details",
  };
  //getParam(dishId,default fallback option)
  // +dishId is 'dishId' string to a Integer
  render() {
    const dishId = this.props.navigation.getParam("dishId", "");

    return (
      <ScrollView>
        <RenderDish dish={this.props.dishes.dishes[+dishId]}
          favorite={this.props.favorites.some(el => el === dishId)}
          onPress={() => this.markFavorite(dishId)}
          toggle={() => this.toggleModal()}
        />
        <RenderComments comments={this.props.comments.comments.filter((comment) => comment.dishId === dishId)} />

        <Modal animationType={"slide"} transparent={false}
          visible={this.state.showModal}
          onDismiss={() => this.toggleModal()}
          onRequestClose={() => this.toggleModal()}>
          <View style={styles.modal}>
            <View>
              <Rating
                ratingCount={5}
                showRating
                count={5}
                imageSize={30}
                style={{ paddingVertical: 10 }}
                onFinishRating={rating => this.setState({ rating: rating })}
              ></Rating>
            </View>
            <View>
              <Input
                placeholder="Author"
                leftIcon={{ type: 'font-awesome', name: 'comment' }}
                onChangeText={value => this.setState({ author: value })}
              />
            </View>
            <View>
              <Input
                placeholder="Comment"
                leftIcon={{ type: 'font-awesome', name: 'comment' }}
                onChangeText={value => this.setState({ comment: value })}
              />
            </View>
            <View style={{ marginBottom: 20, paddingVertical: 20 }}>
              <Button
                onPress={() => this.handleComment(dishId, this.state.rating, this.state.author, this.state.comment)}
                title="SUBMIT"
                color="#512DA8"
                accessibilityLabel="Learn more about this purple button"
              />
            </View>
            <Button
              onPress={() => this.toggleModal()}
              color="#512DA8"
              title="Close"
            />
          </View>
        </Modal>
      </ScrollView >
    );
  }
}

const styles = StyleSheet.create({
  formRow: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    flexDirection: 'row',
    margin: 20
  },
  formLabel: {
    fontSize: 18,
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formItem: {
    flex: 1
  },
  modal: {
    justifyContent: 'center',
    margin: 20
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    backgroundColor: '#512DA8',
    textAlign: 'center',
    color: 'white',
    marginBottom: 20
  },
  modalText: {
    fontSize: 18,
    margin: 10
  }
});

export default connect(mapStateToProps, mapDispatchToProps)(Dishdetail);

<template>
  <div>
    <div
      class="view login"
      v-if="state.username === '' || state.username === null"
    >
      <form class="login-form" @submit.prevent="Login">
        <div class="form-inner">
          <h1>Login to OTOMO</h1>
          <label for="username">Username</label>
          <input
            type="text"
            v-model="inputUsername"
            placeholder="Please enter your name..."
          />
          <input type="submit" value="Login" />
        </div>
      </form>
    </div>
    <div
      :class="{
        view: state.neutral,
        viewvn: state.veryNegative,
        viewn: state.negative,
        viewvp: state.veryPositive,
        viewp: state.positive,
        chat: state.neutral,
        chatvn: state.veryNegative,
        chatn: state.negative,
        chatvp: state.veryPositive,
        chatp: state.positive,
      }"
      v-else
    >
      <header>
        <button class="logout" @click="Logout">Logout</button>
        <h1>Welcome, {{ state.username }}</h1>
      </header>
      <section class="chat-box">
        <div
          v-for="message in state.messages"
          :key="message.key"
          :class="
            message.username == state.username ? 'message user' : 'message'
          "
        >
          <div v-if="!!message.imageUrl">
            <image-card :imagePath="message.imageUrl" />
          </div>
          <div v-else>
            <div class="message-inner">
              <div class="username">{{ message.username }}</div>
              <div class="content">{{ message.content }}</div>
            </div>
          </div>
        </div>
      </section>
      <footer>
        <form @submit.prevent="SendMessage">
          <p v-show="state.neutral" class="face">😌</p>
          <p v-show="state.veryNegative" class="facevn">😣</p>
          <p v-show="state.negative" class="facen">😞</p>
          <p v-show="state.veryPositive" class="facevp">🤗</p>
          <p v-show="state.positive" class="facep">😄</p>
          <input
            type="text"
            v-model="inputMessage"
            placeholder="Write a message..."
          />
          <input type="submit" value="Send" />
        </form>
        <image-upload @sendImageUrl="sendImageUrl" />
      </footer>
    </div>
  </div>
</template>

<script>
import { reactive, onMounted, ref } from "vue";
import axios from "axios";
import db from "./firebase";
import getSentiment from "./sentiment";
import ImageUpload from "./ImageUpload.vue";
import ImageCard from "./ImageCard.vue";

export default {
  components: { ImageUpload, ImageCard },
  setup() {
    const inputUsername = ref("");
    const inputMessage = ref("");

    const state = reactive({
      username: "",
      messages: [],
      prevText1: "",
      prevText2: "",
      prevText3: "",
      sentiment: 0.0,
      imageUrl: undefined,
      neutral: true,
      veryNegative: false,
      negative: false,
      veryPositive: false,
      positive: false,
    });

    const Login = () => {
      if (inputUsername.value != "" || inputUsername.value != null) {
        state.username = inputUsername.value;
        inputUsername.value = "";
        GetMessages();
      }
    };

    const Logout = () => {
      state.username = "";
      state.messages = [];
      state.neutral = true;
      state.veryNegative = false;
      state.negative = false;
      state.veryPositive = false;
      state.positive = false;
    };

    const SendMessage = () => {
      const messagesRef = db.database().ref(`${state.username}/messages`);
      if (inputMessage.value == "" || inputMessage.value == null) {
        return;
      }

      console.log(inputMessage.value);
      GetSentiment(inputMessage.value);

      let image = "";
      if (state.imageUrl) {
        image = state.imageUrl;
      }

      const message = {
        username: state.username,
        content: inputMessage.value,
        imageUrl: image,
        sentiment: state.sentiment,
      };

      messagesRef.push(message);

      GetAIText(message, messagesRef);

      inputMessage.value = "";

      GetMessages();
    };

    const GetAIText = (message, messagesRef) => {
      let prevText1 = "";
      if (state.prevText1) {
        prevText1 = `&param_text_prev1=${state.prevText1}`;
      }
      let prevText2 = "";
      if (state.prevText2) {
        prevText2 = `&param_text_prev2=${state.prevText2}`;
      }
      let prevText3 = "";
      if (state.prevText3) {
        prevText3 = `&param_text_prev3=${state.prevText3}`;
      }

      const sceneList = [
        "美しい",
        "うつくしい",
        "綺麗",
        "きれい",
        "素晴らしい",
        "すばらしい",
        "よい",
        "よかった",
        "いい",
        "景色",
        "風景",
        "場所",
      ];

      const foodList = [
        "ご飯",
        "めし",
        "飯",
        "食べ物",
        "美味しい",
        "うまい",
        "うまかった",
        "美味しかった",
        "美味かった",
        "料理",
      ];

      const priceList = [
        "たかい",
        "高い",
        "値段",
        "価格",
        "高かった",
        "たかかった",
        "奮発した",
        "お金",
        "おかね",
        "贅沢",
      ];

      const sceneReactionMapList = [
        "心が癒されますね！",
        "私も見れてうれしいです！",
        "また見たいですね！",
        "感動ですね！",
        "最高すぎます！",
        "まさにプライスレス！",
      ];

      const foodReactionMapList = [
        "すごい美味しそう！",
        "旅行の醍醐味はやっぱり美味しい食べ物ですね",
        "羨ましい、、",
        "食べたい、、",
        "また食べたくなるやつですね笑",
      ];

      const priceReactionMapList = [
        "たまには贅沢しましょう！",
        "せっかくの旅行なので気にせずに！",
        "値段は忘れましょう！",
      ];

      var foodFlag = false;
      var sceenFlag = false;
      var priceFlag = false;

      let url = `https://jlp.yahooapis.jp/NLUService/V1/analyze?appid=dj00aiZpPTE3ak5ST3Fjd2RtTCZzPWNvbnN1bWVyc2VjcmV0Jng9MjY-&intext=${inputMessage.value}${prevText1}${prevText2}${prevText3}`;
      axios
        .get(url)
        .then((res) => {
          message.username = "OTOMO";
          message.sentiment = 0.0;
          let result = res.data.result;
          for (let i = 0; i < foodList.length; i++) {
            if (result.intext.match(foodList[i])) {
              foodFlag = true;
              break;
            }
          }

          for (let i = 0; i < sceneList.length; i++) {
            if (result.intext.match(sceneList[i])) {
              sceenFlag = true;
              break;
            }
          }

          for (let i = 0; i < priceList.length; i++) {
            if (result.intext.match(priceList[i])) {
              priceFlag = true;
              break;
            }
          }

          if (result.method == "SAY") {
            if (foodFlag == true) {
              const num = Math.floor(
                Math.random() * foodReactionMapList.length
              );
              message.content = foodReactionMapList[num];
            } else if (sceenFlag == true) {
              const num = Math.floor(
                Math.random() * sceneReactionMapList.length
              );
              message.content = sceneReactionMapList[num];
            } else if (priceFlag == true) {
              const num = Math.floor(
                Math.random() * priceReactionMapList.length
              );
              message.content = priceReactionMapList[num];
            } else {
              message.content = result.param_text;
            }
          } else if (result.method == "WEATHER") {
            if (
              result.param_method_subcat == "HIGH" ||
              result.param_method_subcat == "LOW" ||
              result.param_method_subcat == "RAIN"
            ) {
              message.content = "https://weather.yahoo.co.jp/weather/";
            } else {
              message.content = `${result.var_test_btsc}度です。`;
            }
          } else if (result.method == "MAP" || result.method == "LOCAL") {
            for (let i = 0; i < sceneList.length; i++) {
              if (result.intext.match("教えて")) {
                message.content = `${result.param_place}周辺に詳しくないです。。。`;
                break;
              } else if (result.intext.match(sceneList[i])) {
                const num = Math.floor(
                  Math.random() * sceneReactionMapList.length
                );
                message.content = sceneReactionMapList[num];
                break;
              } else {
                message.content = `${result.param_place}に来れて私も嬉しいです、また来たいですね！`;
                break;
              }
            }
          } else {
            message.content = "そうですね、、ちょっと分からないかもです ";
          }
          messagesRef.push(message);
        })
        .catch((err) => {
          console.log("err: ", err);
        });
    };

    const GetMessages = () => {
      const messagesRef = db.database().ref(`${state.username}/messages`);
      if (messagesRef) {
        messagesRef.on("value", (snapshot) => {
          const data = snapshot.val();
          let messages = [];

          Object.keys(data).forEach((key) => {
            messages.push({
              id: key,
              username: data[key].username,
              content: data[key].content,
              imageUrl: data[key].imageUrl,
              sentiment: data[key].sentiment,
            });
          });
          if (messages.length > 1) {
            state.prevText1 = messages[1].content;
            if (messages.length > 3) {
              state.prevText2 = messages[1].content;
              state.prevText1 = messages[3].content;
              if (messages.length > 5) {
                state.prevText3 = messages[messages.length - 5].content;
                state.prevText2 = messages[messages.length - 3].content;
                state.prevText1 = messages[messages.length - 1].content;
              }
            }
          }
          state.messages = messages;
        });
      }
    };

    const sendImageUrl = (imageUrlPath) => {
      const messagesRef = db.database().ref(`${state.username}/messages`);
      const message = {
        username: state.username,
        content: "image",
        imageUrl: imageUrlPath,
        sentiment: 0,
      };
      messagesRef.push(message);

      GetMessages();
    };

    const GetSentiment = async (message) => {
      await getSentiment(message)
        .then((sentiment) => {
          state.sentiment = sentiment.magnitude * sentiment.score;
          JudgeSentiment(state.sentiment);
        })
        .catch((err) => console.error(err));
    };

    const JudgeSentiment = (sentiment) => {
      console.log(sentiment);
      if (sentiment < -0.5) {
        (state.neutral = false),
          (state.veryNegative = true),
          (state.negative = false),
          (state.veryPositive = false),
          (state.positive = false);
      } else if (sentiment < -0.1) {
        (state.neutral = false),
          (state.veryNegative = false),
          (state.negative = true),
          (state.veryPositive = false),
          (state.positive = false);
      } else if (sentiment < 0.1) {
        (state.neutral = true),
          (state.veryNegative = false),
          (state.negative = false),
          (state.veryPositive = false),
          (state.positive = false);
      } else if (sentiment < 0.5) {
        (state.neutral = false),
          (state.veryNegative = false),
          (state.negative = false),
          (state.veryPositive = false),
          (state.positive = true);
      } else {
        (state.neutral = false),
          (state.veryNegative = false),
          (state.negative = false),
          (state.veryPositive = true),
          (state.positive = false);
      }
    };

    onMounted(() => {});

    return {
      inputUsername,
      Login,
      state,
      inputMessage,
      SendMessage,
      Logout,
      GetAIText,
      GetMessages,
      GetSentiment,
      sendImageUrl,
      JudgeSentiment,
    };
  },
};
</script>

<style scoped lang="scss">
$neutral: #17a717;
$veryNegative: #1809eb;
$negative: #54a6f2;
$veryPositive: #ff5a2c;
$positive: #ff8f2c;

.face {
  padding: 9px 5px 5px 5px;
  margin: 0 5px 0 0;
  border: solid 1px;
  border-radius: 10px 10px 10px 10px;
  border-color: #aaa;
  background-color: $neutral;
  //   margin: 10px, 10px, 10px, 10px;
}
.facevn {
  padding: 9px 5px 5px 5px;
  margin: 0 5px 0 0;
  border: solid 1px;
  border-radius: 10px 10px 10px 10px;
  border-color: #aaa;
  background-color: $veryNegative;
  //   margin: 10px, 10px, 10px, 10px;
}
.facevp {
  padding: 9px 5px 5px 5px;
  margin: 0 5px 0 0;
  border: solid 1px;
  border-radius: 10px 10px 10px 10px;
  border-color: #aaa;
  background-color: $veryPositive;
  //   margin: 10px, 10px, 10px, 10px;
}
.facen {
  padding: 9px 5px 5px 5px;
  margin: 0 5px 0 0;
  border: solid 1px;
  border-radius: 10px 10px 10px 10px;
  border-color: #aaa;
  background-color: $negative;
  //   margin: 10px, 10px, 10px, 10px;
}
.facep {
  padding: 9px 5px 5px 5px;
  margin: 0 5px 0 0;
  border: solid 1px;
  border-radius: 10px 10px 10px 10px;
  border-color: #aaa;
  background-color: $positive;
  //   margin: 10px, 10px, 10px, 10px;
}

* {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.view {
  display: flex;
  justify-content: center;
  min-height: 100vh;
  background-color: #17a717;

  &.login {
    align-items: center;
    .login-form {
      display: block;
      width: 100%;
      padding: 15px;

      .form-inner {
        display: block;
        background-color: #fff;
        padding: 50px 15px;
        border-radius: 16px;
        box-shadow: 0px 6px 12px rgba(0, 0, 0, 0.2);
        h1 {
          color: #aaa;
          font-size: 28px;
          margin-bottom: 30px;
        }
        label {
          display: block;
          margin-bottom: 5px;
          color: #aaa;
          font-size: 16px;
          transition: 0.4s;
        }
        input[type="text"] {
          appearance: none;
          border: none;
          outline: none;
          background: none;
          display: block;
          width: 100%;
          padding: 10px 15px;
          border-radius: 8px;
          margin-bottom: 15px;

          color: #333;
          font-size: 18px;
          box-shadow: 0px 0px 0px rgba(0, 0, 0, 0);
          background-color: #f3f3f3;
          transition: 0.4s;
          &::placeholder {
            color: #888;
            transition: 0.4s;
          }
        }
        input[type="submit"] {
          appearance: none;
          border: none;
          outline: none;
          background: none;
          display: block;
          width: 100%;
          padding: 10px 15px;
          background-color: #17a717;
          border-radius: 8px;
          color: #fff;
          font-size: 18px;
          font-weight: 700;
        }
        &:focus-within {
          label {
            color: #17a717;
          }
          input[type="text"] {
            background-color: #fff;
            box-shadow: 0 0 6px rgba(0, 0, 0, 0.2);
            &::placeholder {
              color: #666;
            }
          }
        }
      }
    }
  }
  &.chat {
    flex-direction: column;
    header {
      position: relative;
      display: block;
      width: 100%;
      padding: 50px 30px 10px;
      .logout {
        position: absolute;
        top: 15px;
        right: 15px;
        appearance: none;
        border: none;
        outline: none;
        background: none;

        color: #fff;
        font-size: 18px;
        margin-bottom: 10px;
        text-align: right;
      }
      h1 {
        color: #fff;
      }
    }
    .chat-box {
      border-radius: 24px 24px 0px 0px;
      background-color: #fff;
      box-shadow: 0px 0px 12px rgba(100, 100, 100, 0.2);
      flex: 1 1 100%;
      padding: 30px;
      .message {
        display: flex;
        margin-bottom: 15px;
        .message-inner {
          .username {
            color: #888;
            font-size: 16px;
            margin-bottom: 5px;
            padding-left: 15px;
            padding-right: 15px;
          }
          .content {
            display: inline-block;
            padding: 10px 20px;
            background-color: #f3f3f3;
            border-radius: 999px;
            color: #333;
            font-size: 18px;
            line-height: 1.2em;
            text-align: left;
          }
        }
        &.user {
          margin-top: 30px;
          justify-content: flex-end;
          text-align: right;
          .message-inner {
            max-width: 75%;
            .content {
              color: #fff;
              font-weight: 600;
              background-color: #17a717;
              min-width: 200px;
            }
          }
        }
      }
    }
    footer {
      position: sticky;
      bottom: 0px;
      background-color: #fff;
      padding: 30px;
      box-shadow: 0px 0px 12px rgba(100, 100, 100, 0.2);
      form {
        display: flex;
        input[type="text"] {
          flex: 1 1 100%;
          appearance: none;
          border: none;
          outline: none;
          background: none;
          display: block;
          width: 100%;
          padding: 10px 15px;
          border-radius: 8px 0px 0px 8px;

          color: #333;
          font-size: 18px;
          box-shadow: 0px 0px 0px rgba(0, 0, 0, 0);
          background-color: #f3f3f3;
          transition: 0.4s;
          &::placeholder {
            color: #888;
            transition: 0.4s;
          }
        }

        input[type="submit"] {
          appearance: none;
          border: none;
          outline: none;
          background: none;
          display: block;
          padding: 10px 15px;
          border-radius: 0px 8px 8px 0px;
          background-color: #17a717;
          color: #fff;
          font-size: 18px;
          font-weight: 700;
        }
      }
    }
  }
}

.viewvn {
  display: flex;
  justify-content: center;
  min-height: 100vh;
  background-color: $veryNegative;

  &.login {
    align-items: center;
    .login-form {
      display: block;
      width: 100%;
      padding: 15px;

      .form-inner {
        display: block;
        background-color: #fff;
        padding: 50px 15px;
        border-radius: 16px;
        box-shadow: 0px 6px 12px rgba(0, 0, 0, 0.2);
        h1 {
          color: #aaa;
          font-size: 28px;
          margin-bottom: 30px;
        }
        label {
          display: block;
          margin-bottom: 5px;
          color: #aaa;
          font-size: 16px;
          transition: 0.4s;
        }
        input[type="text"] {
          appearance: none;
          border: none;
          outline: none;
          background: none;
          display: block;
          width: 100%;
          padding: 10px 15px;
          border-radius: 8px;
          margin-bottom: 15px;

          color: #333;
          font-size: 18px;
          box-shadow: 0px 0px 0px rgba(0, 0, 0, 0);
          background-color: #f3f3f3;
          transition: 0.4s;
          &::placeholder {
            color: #888;
            transition: 0.4s;
          }
        }
        input[type="submit"] {
          appearance: none;
          border: none;
          outline: none;
          background: none;
          display: block;
          width: 100%;
          padding: 10px 15px;
          background-color: #17a717;
          border-radius: 8px;
          color: #fff;
          font-size: 18px;
          font-weight: 700;
        }
        &:focus-within {
          label {
            color: #17a717;
          }
          input[type="text"] {
            background-color: #fff;
            box-shadow: 0 0 6px rgba(0, 0, 0, 0.2);
            &::placeholder {
              color: #666;
            }
          }
        }
      }
    }
  }
  &.chatvn {
    flex-direction: column;
    header {
      position: relative;
      display: block;
      width: 100%;
      padding: 50px 30px 10px;
      .logout {
        position: absolute;
        top: 15px;
        right: 15px;
        appearance: none;
        border: none;
        outline: none;
        background: none;

        color: #fff;
        font-size: 18px;
        margin-bottom: 10px;
        text-align: right;
      }
      h1 {
        color: #fff;
      }
    }
    .chat-box {
      border-radius: 24px 24px 0px 0px;
      background-color: #fff;
      box-shadow: 0px 0px 12px rgba(100, 100, 100, 0.2);
      flex: 1 1 100%;
      padding: 30px;
      .message {
        display: flex;
        margin-bottom: 15px;

        .message-inner {
          .username {
            color: #888;
            font-size: 16px;
            margin-bottom: 5px;
            padding-left: 15px;
            padding-right: 15px;
          }
          .content {
            display: inline-block;
            padding: 10px 20px;
            background-color: #f3f3f3;
            border-radius: 999px;
            color: #333;
            font-size: 18px;
            line-height: 1.2em;
            text-align: left;
          }
        }
        &.user {
          margin-top: 30px;
          justify-content: flex-end;
          text-align: right;
          .message-inner {
            max-width: 75%;
            .content {
              color: #fff;
              font-weight: 600;
              background-color: $veryNegative;
              min-width: 200px;
            }
          }
        }
      }
    }
    footer {
      position: sticky;
      bottom: 0px;
      background-color: #fff;
      padding: 30px;
      box-shadow: 0px 0px 12px rgba(100, 100, 100, 0.2);
      form {
        display: flex;
        input[type="text"] {
          flex: 1 1 100%;
          appearance: none;
          border: none;
          outline: none;
          background: none;
          display: block;
          width: 100%;
          padding: 10px 15px;
          border-radius: 8px 0px 0px 8px;

          color: #333;
          font-size: 18px;
          box-shadow: 0px 0px 0px rgba(0, 0, 0, 0);
          background-color: #f3f3f3;
          transition: 0.4s;
          &::placeholder {
            color: #888;
            transition: 0.4s;
          }
        }

        input[type="submit"] {
          appearance: none;
          border: none;
          outline: none;
          background: none;
          display: block;
          padding: 10px 15px;
          border-radius: 0px 8px 8px 0px;
          background-color: $veryNegative;
          color: #fff;
          font-size: 18px;
          font-weight: 700;
        }
      }
    }
  }
}

.viewn {
  display: flex;
  justify-content: center;
  min-height: 100vh;
  background-color: $negative;

  &.login {
    align-items: center;
    .login-form {
      display: block;
      width: 100%;
      padding: 15px;

      .form-inner {
        display: block;
        background-color: #fff;
        padding: 50px 15px;
        border-radius: 16px;
        box-shadow: 0px 6px 12px rgba(0, 0, 0, 0.2);
        h1 {
          color: #aaa;
          font-size: 28px;
          margin-bottom: 30px;
        }
        label {
          display: block;
          margin-bottom: 5px;
          color: #aaa;
          font-size: 16px;
          transition: 0.4s;
        }
        input[type="text"] {
          appearance: none;
          border: none;
          outline: none;
          background: none;
          display: block;
          width: 100%;
          padding: 10px 15px;
          border-radius: 8px;
          margin-bottom: 15px;

          color: #333;
          font-size: 18px;
          box-shadow: 0px 0px 0px rgba(0, 0, 0, 0);
          background-color: #f3f3f3;
          transition: 0.4s;
          &::placeholder {
            color: #888;
            transition: 0.4s;
          }
        }
        input[type="submit"] {
          appearance: none;
          border: none;
          outline: none;
          background: none;
          display: block;
          width: 100%;
          padding: 10px 15px;
          background-color: #17a717;
          border-radius: 8px;
          color: #fff;
          font-size: 18px;
          font-weight: 700;
        }
        &:focus-within {
          label {
            color: #17a717;
          }
          input[type="text"] {
            background-color: #fff;
            box-shadow: 0 0 6px rgba(0, 0, 0, 0.2);
            &::placeholder {
              color: #666;
            }
          }
        }
      }
    }
  }
  &.chatn {
    flex-direction: column;
    header {
      position: relative;
      display: block;
      width: 100%;
      padding: 50px 30px 10px;
      .logout {
        position: absolute;
        top: 15px;
        right: 15px;
        appearance: none;
        border: none;
        outline: none;
        background: none;

        color: #fff;
        font-size: 18px;
        margin-bottom: 10px;
        text-align: right;
      }
      h1 {
        color: #fff;
      }
    }
    .chat-box {
      border-radius: 24px 24px 0px 0px;
      background-color: #fff;
      box-shadow: 0px 0px 12px rgba(100, 100, 100, 0.2);
      flex: 1 1 100%;
      padding: 30px;
      .message {
        display: flex;
        margin-bottom: 15px;

        .message-inner {
          .username {
            color: #888;
            font-size: 16px;
            margin-bottom: 5px;
            padding-left: 15px;
            padding-right: 15px;
          }
          .content {
            display: inline-block;
            padding: 10px 20px;
            background-color: #f3f3f3;
            border-radius: 999px;
            color: #333;
            font-size: 18px;
            line-height: 1.2em;
            text-align: left;
          }
        }
        &.user {
          margin-top: 30px;
          justify-content: flex-end;
          text-align: right;
          .message-inner {
            max-width: 75%;
            .content {
              color: #fff;
              font-weight: 600;
              background-color: $negative;
              min-width: 200px;
            }
          }
        }
      }
    }
    footer {
      position: sticky;
      bottom: 0px;
      background-color: #fff;
      padding: 30px;
      box-shadow: 0px 0px 12px rgba(100, 100, 100, 0.2);
      form {
        display: flex;
        input[type="text"] {
          flex: 1 1 100%;
          appearance: none;
          border: none;
          outline: none;
          background: none;
          display: block;
          width: 100%;
          padding: 10px 15px;
          border-radius: 8px 0px 0px 8px;

          color: #333;
          font-size: 18px;
          box-shadow: 0px 0px 0px rgba(0, 0, 0, 0);
          background-color: #f3f3f3;
          transition: 0.4s;
          &::placeholder {
            color: #888;
            transition: 0.4s;
          }
        }

        input[type="submit"] {
          appearance: none;
          border: none;
          outline: none;
          background: none;
          display: block;
          padding: 10px 15px;
          border-radius: 0px 8px 8px 0px;
          background-color: $negative;
          color: #fff;
          font-size: 18px;
          font-weight: 700;
        }
      }
    }
  }
}
.viewvp {
  display: flex;
  justify-content: center;
  min-height: 100vh;
  background-color: $veryPositive;

  &.login {
    align-items: center;
    .login-form {
      display: block;
      width: 100%;
      padding: 15px;

      .form-inner {
        display: block;
        background-color: #fff;
        padding: 50px 15px;
        border-radius: 16px;
        box-shadow: 0px 6px 12px rgba(0, 0, 0, 0.2);
        h1 {
          color: #aaa;
          font-size: 28px;
          margin-bottom: 30px;
        }
        label {
          display: block;
          margin-bottom: 5px;
          color: #aaa;
          font-size: 16px;
          transition: 0.4s;
        }
        input[type="text"] {
          appearance: none;
          border: none;
          outline: none;
          background: none;
          display: block;
          width: 100%;
          padding: 10px 15px;
          border-radius: 8px;
          margin-bottom: 15px;

          color: #333;
          font-size: 18px;
          box-shadow: 0px 0px 0px rgba(0, 0, 0, 0);
          background-color: #f3f3f3;
          transition: 0.4s;
          &::placeholder {
            color: #888;
            transition: 0.4s;
          }
        }
        input[type="submit"] {
          appearance: none;
          border: none;
          outline: none;
          background: none;
          display: block;
          width: 100%;
          padding: 10px 15px;
          background-color: #17a717;
          border-radius: 8px;
          color: #fff;
          font-size: 18px;
          font-weight: 700;
        }
        &:focus-within {
          label {
            color: #17a717;
          }
          input[type="text"] {
            background-color: #fff;
            box-shadow: 0 0 6px rgba(0, 0, 0, 0.2);
            &::placeholder {
              color: #666;
            }
          }
        }
      }
    }
  }
  &.chatvp {
    flex-direction: column;
    header {
      position: relative;
      display: block;
      width: 100%;
      padding: 50px 30px 10px;
      .logout {
        position: absolute;
        top: 15px;
        right: 15px;
        appearance: none;
        border: none;
        outline: none;
        background: none;

        color: #fff;
        font-size: 18px;
        margin-bottom: 10px;
        text-align: right;
      }
      h1 {
        color: #fff;
      }
    }
    .chat-box {
      border-radius: 24px 24px 0px 0px;
      background-color: #fff;
      box-shadow: 0px 0px 12px rgba(100, 100, 100, 0.2);
      flex: 1 1 100%;
      padding: 30px;
      .message {
        display: flex;
        margin-bottom: 15px;

        .message-inner {
          .username {
            color: #888;
            font-size: 16px;
            margin-bottom: 5px;
            padding-left: 15px;
            padding-right: 15px;
          }
          .content {
            display: inline-block;
            padding: 10px 20px;
            background-color: #f3f3f3;
            border-radius: 999px;
            color: #333;
            font-size: 18px;
            line-height: 1.2em;
            text-align: left;
          }
        }
        &.user {
          margin-top: 30px;
          justify-content: flex-end;
          text-align: right;
          .message-inner {
            max-width: 75%;
            .content {
              color: #fff;
              font-weight: 600;
              background-color: $veryPositive;
              min-width: 200px;
            }
          }
        }
      }
    }
    footer {
      position: sticky;
      bottom: 0px;
      background-color: #fff;
      padding: 30px;
      box-shadow: 0px 0px 12px rgba(100, 100, 100, 0.2);
      form {
        display: flex;
        input[type="text"] {
          flex: 1 1 100%;
          appearance: none;
          border: none;
          outline: none;
          background: none;
          display: block;
          width: 100%;
          padding: 10px 15px;
          border-radius: 8px 0px 0px 8px;

          color: #333;
          font-size: 18px;
          box-shadow: 0px 0px 0px rgba(0, 0, 0, 0);
          background-color: #f3f3f3;
          transition: 0.4s;
          &::placeholder {
            color: #888;
            transition: 0.4s;
          }
        }

        input[type="submit"] {
          appearance: none;
          border: none;
          outline: none;
          background: none;
          display: block;
          padding: 10px 15px;
          border-radius: 0px 8px 8px 0px;
          background-color: $veryPositive;
          color: #fff;
          font-size: 18px;
          font-weight: 700;
        }
      }
    }
  }
}

.viewp {
  display: flex;
  justify-content: center;
  min-height: 100vh;
  background-color: $positive;

  &.login {
    align-items: center;
    .login-form {
      display: block;
      width: 100%;
      padding: 15px;

      .form-inner {
        display: block;
        background-color: #fff;
        padding: 50px 15px;
        border-radius: 16px;
        box-shadow: 0px 6px 12px rgba(0, 0, 0, 0.2);
        h1 {
          color: #aaa;
          font-size: 28px;
          margin-bottom: 30px;
        }
        label {
          display: block;
          margin-bottom: 5px;
          color: #aaa;
          font-size: 16px;
          transition: 0.4s;
        }
        input[type="text"] {
          appearance: none;
          border: none;
          outline: none;
          background: none;
          display: block;
          width: 100%;
          padding: 10px 15px;
          border-radius: 8px;
          margin-bottom: 15px;

          color: #333;
          font-size: 18px;
          box-shadow: 0px 0px 0px rgba(0, 0, 0, 0);
          background-color: #f3f3f3;
          transition: 0.4s;
          &::placeholder {
            color: #888;
            transition: 0.4s;
          }
        }
        input[type="submit"] {
          appearance: none;
          border: none;
          outline: none;
          background: none;
          display: block;
          width: 100%;
          padding: 10px 15px;
          background-color: #17a717;
          border-radius: 8px;
          color: #fff;
          font-size: 18px;
          font-weight: 700;
        }
        &:focus-within {
          label {
            color: #17a717;
          }
          input[type="text"] {
            background-color: #fff;
            box-shadow: 0 0 6px rgba(0, 0, 0, 0.2);
            &::placeholder {
              color: #666;
            }
          }
        }
      }
    }
  }
  &.chatp {
    flex-direction: column;
    header {
      position: relative;
      display: block;
      width: 100%;
      padding: 50px 30px 10px;
      .logout {
        position: absolute;
        top: 15px;
        right: 15px;
        appearance: none;
        border: none;
        outline: none;
        background: none;

        color: #fff;
        font-size: 18px;
        margin-bottom: 10px;
        text-align: right;
      }
      h1 {
        color: #fff;
      }
    }
    .chat-box {
      border-radius: 24px 24px 0px 0px;
      background-color: #fff;
      box-shadow: 0px 0px 12px rgba(100, 100, 100, 0.2);
      flex: 1 1 100%;
      padding: 30px;
      .message {
        display: flex;
        margin-bottom: 15px;

        .message-inner {
          .username {
            color: #888;
            font-size: 16px;
            margin-bottom: 5px;
            padding-left: 15px;
            padding-right: 15px;
          }
          .content {
            display: inline-block;
            padding: 10px 20px;
            background-color: #f3f3f3;
            border-radius: 999px;
            color: #333;
            font-size: 18px;
            line-height: 1.2em;
            text-align: left;
          }
        }
        &.user {
          margin-top: 30px;
          justify-content: flex-end;
          text-align: right;
          .message-inner {
            max-width: 75%;
            .content {
              color: #fff;
              font-weight: 600;
              background-color: $positive;
              min-width: 200px;
            }
          }
        }
      }
    }
    footer {
      position: sticky;
      bottom: 0px;
      background-color: #fff;
      padding: 30px;
      box-shadow: 0px 0px 12px rgba(100, 100, 100, 0.2);
      form {
        display: flex;
        input[type="text"] {
          flex: 1 1 100%;
          appearance: none;
          border: none;
          outline: none;
          background: none;
          display: block;
          width: 100%;
          padding: 10px 15px;
          border-radius: 8px 0px 0px 8px;

          color: #333;
          font-size: 18px;
          box-shadow: 0px 0px 0px rgba(0, 0, 0, 0);
          background-color: #f3f3f3;
          transition: 0.4s;
          &::placeholder {
            color: #888;
            transition: 0.4s;
          }
        }

        input[type="submit"] {
          appearance: none;
          border: none;
          outline: none;
          background: none;
          display: block;
          padding: 10px 15px;
          border-radius: 0px 8px 8px 0px;
          background-color: $positive;
          color: #fff;
          font-size: 18px;
          font-weight: 700;
        }
      }
    }
  }
}
</style>

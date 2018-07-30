const Alexa = require('ask-sdk-core');
const kintone = require('kintone-nodejs-sdk');

// Lambdaの環境変数からKintoneデータベースへの認証情報を取得
const APIToken = process.env['Kintone_APIToken'];
const DomainName = process.env['Kintone_DomainName'];
const AppID = process.env['Kintone_AppID'];
const kintoneAuth = new kintone.Auth();
kintoneAuth.setApiToken(APIToken);
const kintoneConnection = new kintone.Connection(DomainName, kintoneAuth);
const kintoneRecord = new kintone.Record(kintoneConnection);

const BackgroundImageURL = 'https://s3-ap-northeast-1.amazonaws.com/alexatrainingassets/images/NihonbashiView.jpg';
const StarImageURL = 'https://s3-ap-northeast-1.amazonaws.com/alexatrainingassets/images/star_32x32.png';

// AlexaのスロットIDとジャンル名をマッピングする連想配列
const genres = {
    '01':'韓国料理',
    '02':'和食',
    '03':'焼肉',
    '04':'カフェ',
    '05':'アジアン',
    '06':'洋食',
    '07':'中華',
    '08':'カレー',
    '09':'イタリアン'
};

// ジャンルメニューに表示する項目
const genre_title = 'ジャンルの選択';
const backgroundImage = new Alexa.ImageHelper()
    .addImageInstance(BackgroundImageURL)
    .getImage();
const textContent1 = new Alexa.PlainTextContentHelper()
    .withPrimaryText('韓国料理')
    .getTextContent();
const listItem1 = {
    token : '韓国料理',
    textContent : textContent1
};
const textContent2 = new Alexa.PlainTextContentHelper()
    .withPrimaryText('和食')
    .getTextContent();
const listItem2 = {
    token : '和食',
    textContent : textContent2
};
const textContent3 = new Alexa.PlainTextContentHelper()
    .withPrimaryText('焼肉')
    .getTextContent();
const listItem3 = {
    token : '焼肉',
    textContent : textContent3
};
const textContent4 = new Alexa.PlainTextContentHelper()
    .withPrimaryText('カフェ')
    .getTextContent();
const listItem4 = {
    token : 'カフェ',
    textContent : textContent4
};
const textContent5 = new Alexa.PlainTextContentHelper()
    .withPrimaryText('アジアン')
    .getTextContent();
const listItem5 = {
    token : 'アジアン',
    textContent : textContent5
};
const textContent6 = new Alexa.PlainTextContentHelper()
    .withPrimaryText('洋食')
    .getTextContent();
const listItem6 = {
    token : '洋食',
    textContent : textContent6
};
const textContent7 = new Alexa.PlainTextContentHelper()
    .withPrimaryText('中華')
    .getTextContent();
const listItem7 = {
    token : '中華',
    textContent : textContent7
};
const textContent8 = new Alexa.PlainTextContentHelper()
    .withPrimaryText('カレー')
    .getTextContent();
const listItem8 = {
    token : 'カレー',
    textContent : textContent8
};
const textContent9 = new Alexa.PlainTextContentHelper()
    .withPrimaryText('イタリアン')
    .getTextContent();
const listItem9 = {
    token : 'イタリアン',
    textContent : textContent9
};

// ジャンルメニューを表示するテンプレート
const genre_template = {
    type: 'ListTemplate1',
    backButton: 'HIDDEN',
    backgroundImage: backgroundImage,
    listItems:  [listItem1,
                listItem2,
                listItem3, 
                listItem4, 
                listItem5, 
                listItem6, 
                listItem7, 
                listItem8,
                listItem9],
    title: genre_title,
    token : null,
};

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
    },
    handle(handlerInput){
        let speechOutput = "「和食」「洋食」「中華料理」のようにジャンルを言うか、「オムライス」のように食べたいランチメニューを言ってみてください";
        let speechPrompt = "「中華」などのジャンル、もしくは食べたい物を言ってみて";
        if(supportsDisplay(handlerInput)){
            // ディスプレイ付きのデバイスの場合の表示
            handlerInput.responseBuilder.addRenderTemplateDirective(genre_template).withShouldEndSession(false);
        }
        return handlerInput.responseBuilder
            .speak(speechOutput)
            .reprompt(speechPrompt)
            .getResponse();
    }
};

const RecommendIntentHandler = {
    canHandle(handlerInput) {
        return (handlerInput.requestEnvelope.request.type === 'IntentRequest'
          && handlerInput.requestEnvelope.request.intent.name === 'RecommendIntent')
        || (handlerInput.requestEnvelope.request.type === 'IntentRequest'
          && handlerInput.requestEnvelope.request.intent.name === 'ElementSelected')
        || handlerInput.requestEnvelope.request.type === 'Display.ElementSelected';
    },
    async handle(handlerInput) {

        let speechOutput = '';
        let speechPrompt = '';
        let genreID = undefined;
        let genre = undefined;

        if (handlerInput.requestEnvelope.request.token){
            genre = handlerInput.requestEnvelope.request.token;
            console.log("Touch Event Detected:" + genre);
        }else{
            genre = getSlot(handlerInput, "genre");
            if(genre !== undefined){
                //ジャンルの指定があったらジャンルIDを取得する
                if(genre.resolutions.resolutionsPerAuthority[0].status.code === 'ER_SUCCESS_MATCH'){
                    genreID = genre.resolutions.resolutionsPerAuthority[0].values[0].value.id;
                }
                else if(genre.resolutions.resolutionsPerAuthority[0].status.code === 'ER_SUCCESS_NO_MATCH'){
                    // リストにないジャンルが指定されたら他を選ぶよう問いかける
                    speechOutput = "「和食」「洋食」「中華料理」のようにジャンルを言うか、「ハンバーグ」のように食べたいランチメニューを言ってみてください";
                    speechPrompt = "ジャンルまたは食べたいものを言ってみて";
                    if(supportsDisplay(handlerInput)){
                        // ディスプレイ付きのデバイスの場合の表示
                        handlerInput.responseBuilder.addRenderTemplateDirective(genre_template).withShouldEndSession(false);
                    }
                    return handlerInput.responseBuilder
                        .speak(speechOutput)
                        .reprompt(speechPrompt)
                        .getResponse();
                }
            }
        }

        let rsp = await getKintoneRecords(genreID);
        let recordCount = rsp.records.length;
        if (recordCount == 0){
            speechOutput = "おすすめのお店が見つかりませんでした。他のジャンル、またはメニューで試してみてください";
            speechPrompt = "「中華」などのジャンル、もしくは食べたい物の名前を言ってみて";
            if(supportsDisplay(handlerInput)){
                // ディスプレイ付きのデバイスの場合の表示
                handlerInput.responseBuilder.addRenderTemplateDirective(genre_template).withShouldEndSession(false);
            }
            return handlerInput.responseBuilder
                .speak(speechOutput)
                .reprompt(speechPrompt)
                .getResponse();
        }
        // 複数のレコードからランダムに1レコード取り出す
        let i = Math.floor(Math.random() * recordCount);
        const record = rsp.records[i];
        const shop_name = record.shop_name.value;
        const shop_name_kana = record.shop_name_kana.value;
        const shop_details = record.shop_details.value;
        const rating_taste = record.rating_taste.value;
        const rating_cospa = record.rating_cospa.value;
        const rating_quickdelivery = record.rating_quickdelivery.value;
        const rating_atmosphere = record.rating_atmosphere.value;
        const smoking_area = record.smoking_area.value;
        const image_url = record.image_url.value;
        const time = record.time_required.value;
        const address = record.address.value;
        const price = record.price_range.value;
        
        speechOutput = `ここから約${time}フンの距離にある${shop_name_kana}がおすすめです。<break time="1s"/>`
            + `価格帯は${price}です。<break time="1s"/>`
            + `${shop_details}`;
        console.log(speechOutput);
        if (supportsDisplay(handlerInput)) {
            // ディスプレイ付きのデバイスの場合の表示
            const myImage = new Alexa.ImageHelper()
                .addImageInstance(image_url)
                .getImage();

            let primaryText = `<font size="1">距離: ここから約${time}分<br/>価格帯: ${price}<br/>所在地: ${address}</font>`;
            let secondaryText = `<font size="1">味: ${getStars(rating_taste)}<br/>コスパ: ${getStars(rating_cospa)}<br/>早さ: ${getStars(rating_quickdelivery)}<br/>雰囲気: ${getStars(rating_atmosphere)}</font>`;
            let tertiaryText = `<font size="1">分煙: ${smoking_area}</font>`;
            const myTextContent = new Alexa.RichTextContentHelper()
                .withPrimaryText(primaryText)
                .withSecondaryText(secondaryText)
                .withTertiaryText(tertiaryText)
                .getTextContent();

            handlerInput.responseBuilder.addRenderTemplateDirective({
                type: 'BodyTemplate1',
                token: null,
                backButton: 'HIDDEN',
                backgroundImage: myImage,
                title: shop_name,
                textContent: myTextContent,
            });
        }
        // ホームカードへの表示
        if(image_url){
            // 画像付き
            handlerInput.responseBuilder.withStandardCard(shop_name, `ここから${time}分\n価格帯: ${price}\n所在地: ${address}\n\n${shop_details}`, image_url, image_url);
        }else{
            // 画像なし
            handlerInput.responseBuilder.withSimpleCard(shop_name, `ここから${time}分\n価格帯: ${price}\n所在地: ${address}\n\n${shop_details}`);
        }
        return handlerInput.responseBuilder
            .speak(speechOutput)
            .withShouldEndSession(true)
            .getResponse();
    }
};

// kintoneのレコードを取得する関数
function getKintoneRecords(genreID) {
    // クエリー文字列
    let query = '';
    if (genreID !== undefined){
        // genreIDが指定されて入れば絞り込み検索。
        query = 'genre in ("' + genres[genreID] + '")';
    }else if(genreID === undefined){
        // genreIDがundefinedならば全検索
        query = '';
    }
	// 取得するフィールド
    let fields = ['shop_name',
                'genre',
                'shop_name_kana',
                'shop_details',
                'price_range',
                'time_required',
                'rating_taste',
                'rating_cospa',
                'rating_quickdelivery',
                'rating_atmosphere',
                'smoking_area',
                'address',
                'image_url'
                ];
	// 件数情報を取得する
	return kintoneRecord.getRecords(AppID, query, fields)
		.then((rsp) => {
			console.log(JSON.stringify(rsp));
			return rsp;
		})
		.catch((err) => {
			console.log(err);
		});
}

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speechOutput = '日本橋界隈のとっておきのランチ情報を教えます。「和食」のようにジャンルを言うか、「ハンバーグ」のように食べたいランチメニューの名前を言ってみてください。';
        const reprompt = 'ジャンル、または食べたい物を言ってみて';
        if(supportsDisplay(handlerInput)){
            handlerInput.responseBuilder.addRenderTemplateDirective(genre_template).withShouldEndSession(false);
        }
        return handlerInput.responseBuilder
        .speak(speechOutput)
        .reprompt(reprompt)
        .getResponse();
    }
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent'
                || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speechOutput = 'またね。';
        return handlerInput.responseBuilder
            .speak(speechOutput)
            .getResponse();
    }
};

const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        return handlerInput.responseBuilder.getResponse();
    }
};

const ErrorHandler = {
    canHandle () {
      return true;
    },
    handle (handlerInput, error) {
      console.log(`Error handled: ${error.message}`);
      const message = "すみません、なんだかうまく行かないようです。もう一度お試しください。";
      return handlerInput.responseBuilder
        .speak(message)
        .getResponse();
    }
}

const skillBuilder = Alexa.SkillBuilders.custom();
exports.handler = skillBuilder
  .addRequestHandlers(
    LaunchRequestHandler,
    RecommendIntentHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    SessionEndedRequestHandler
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();


// スキルが画面付きデバイスで動作しているかどうかを調べるヘルパー関数
// 画面付きの時は true を返す。 
function supportsDisplay(handlerInput)
{
    var hasDisplay =
    handlerInput.requestEnvelope.context &&
    handlerInput.requestEnvelope.context.System &&
    handlerInput.requestEnvelope.context.System.device &&
    handlerInput.requestEnvelope.context.System.device.supportedInterfaces &&
    handlerInput.requestEnvelope.context.System.device.supportedInterfaces.Display;
    return hasDisplay;
}

// スロットの値を取得するヘルパー関数
function getSlot(handlerInput, slotName)
{
    let request = handlerInput.requestEnvelope.request;
    if (
        request &&
        request.intent &&
        request.intent.slots &&
        request.intent.slots[slotName]
    ){
        return handlerInput.requestEnvelope.request.intent.slots[slotName];    
    }
    else return undefined;
}

// レーティングの星マークの文字列を生成するヘルパー関数
function getStars(num){
    if(num === null) return "";

    let stars = '';
    for(let i=0;i<num;i++){
        stars += `<img src="${StarImageURL}" />`;
    }
    console.log(stars);
    return stars;
}

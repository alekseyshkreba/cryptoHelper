const { SMA, EMA, RSI, MACD, BollingerBands } = require('technicalindicators');
const axios = require('axios');

async function getHistoricalDataWithVolume(cryptoId = 'bitcoin', days = 30) {
  try {
    const url = `https://api.coingecko.com/api/v3/coins/${cryptoId}/market_chart`;
    const response = await axios.get(url, {
      params: {
        vs_currency: 'usd',
        days: days
      }
    });

    return {
      prices: response.data.prices.map(price => price[1]),
      volumes: response.data.total_volumes.map(volume => volume[1])
    };
  } catch (error) {
    console.error('Error fetching historical data:', error.message);
    return [];
  }
}

async function analyzeCryptoTrendWithIndicators(cryptoId = 'bitcoin') {
  const data = await getHistoricalDataWithVolume(cryptoId, 30);
  const prices = data.prices;

  if (prices.length === 0) {
    console.log('No historical data found for', cryptoId);
    return;
  }

  const shortTermSMA = SMA.calculate({ period: 5, values: prices });
  const longTermSMA = SMA.calculate({ period: 20, values: prices });
  const rsiValues = RSI.calculate({ period: 14, values: prices });
  const macdValues = MACD.calculate({ values: prices, fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 });
  const bbValues = BollingerBands.calculate({ period: 20, values: prices, stdDev: 2 });

  const latestValues = {
    'Name': cryptoId,
    "Short Term SMA": shortTermSMA[shortTermSMA.length - 1],
    "Long Term SMA": longTermSMA[longTermSMA.length - 1],
    RSI: rsiValues[rsiValues.length - 1],
    "MACD Line": macdValues[macdValues.length - 1].MACD,
    "MACD Signal": macdValues[macdValues.length - 1].signal,
    "BB Upper": bbValues[bbValues.length - 1].upper,
    "BB Lower": bbValues[bbValues.length - 1].lower,
  };

  console.table(latestValues);

  let analysis = 'Current situation: ';
  analysis += latestValues["Short Term SMA"] > latestValues["Long Term SMA"]
    ? 'The trend is bullish. Consider buying or holding the asset as prices might continue to rise. '
    : 'The trend is bearish. Consider selling or waiting as prices may continue to fall. ';

  analysis += latestValues.RSI > 70
    ? 'The asset is overbought, which might indicate a potential price correction or pullback. Caution is advised for new purchases. '
    : latestValues.RSI < 30
      ? 'The asset is oversold, which could be a signal for a potential price rebound. It might be a good opportunity to consider buying. '
      : 'The asset is within normal RSI levels, suggesting stable conditions with no extreme movements expected soon.';


  console.log(analysis);
}

analyzeCryptoTrendWithIndicators('bitcoin');
analyzeCryptoTrendWithIndicators('ethereum');
analyzeCryptoTrendWithIndicators('solana');

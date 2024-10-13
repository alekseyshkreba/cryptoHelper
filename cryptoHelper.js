const { SMA, EMA, RSI, MACD, BollingerBands } = require('technicalindicators');
const axios = require('axios');

async function getHistoricalDataWithVolume(cryptoId = 'bitcoin', days = 30) {
  try {
    const url = `https://api.coingecko.com/api/v3/coins/${cryptoId}/market_chart`;
    const response = await axios.get(url, {
      params: { vs_currency: 'usd', days }
    });
    return {
      prices: response.data.prices.map(price => price[1]),
      volumes: response.data.total_volumes.map(volume => volume[1])
    };
  } catch (error) {
    console.error('Error fetching historical data:', error.message);
    return { prices: [], volumes: [] };
  }
}

function explainIndicatorAnalysis(latestValues) {
  let explanation = '';

  explanation += latestValues["SMA Signal"] === '+'
      ? 'Краткосрочная SMA выше долгосрочной SMA, что указывает на восходящий тренд. Рассмотрите возможность покупки или удержания. '
      : 'Краткосрочная SMA ниже долгосрочной SMA, что указывает на нисходящий тренд. Рассмотрите возможность продажи или подождите. ';

  explanation += latestValues["RSI Signal"] === '+'
      ? 'RSI показывает, что актив не перекуплен и не перепродан. Условия стабильные. Рассмотрите возможность удержания. '
      : latestValues.RSI > 70
          ? 'RSI показывает перекупленность актива, что может указывать на возможную коррекцию цен. Рассмотрите возможность продажи. '
          : 'RSI показывает перепроданность актива, что может указывать на возможный отскок цен. Рассмотрите возможность покупки. ';

  explanation += latestValues["MACD Signal"] === '+'
      ? 'MACD указывает на восходящий тренд. Рассмотрите возможность покупки. '
      : 'MACD указывает на нисходящий тренд. Рассмотрите возможность продажи. ';

  explanation += latestValues["Volume Signal"] === '+'
      ? 'Объем торгов высокий, что подтверждает силу тренда. '
      : 'Объем торгов низкий, что указывает на слабость тренда. ';

  return explanation;
}


async function analyzeCryptoTrendWithIndicators(cryptoId = 'bitcoin') {
  const data = await getHistoricalDataWithVolume(cryptoId, 30);
  const { prices, volumes } = data;

  if (prices.length === 0) {
    console.log(`No historical data found for ${cryptoId}`);
    return;
  }

  const shortTermSMA = SMA.calculate({ period: 5, values: prices });
  const longTermSMA = SMA.calculate({ period: 20, values: prices });
  const rsiValues = RSI.calculate({ period: 14, values: prices });
  const macdValues = MACD.calculate({ values: prices, fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 });
  const bbValues = BollingerBands.calculate({ period: 20, values: prices, stdDev: 2 });
  const volumeSMA = SMA.calculate({ period: 5, values: volumes });

  const latestValues = {
    'Name': cryptoId,
    "Short Term SMA": shortTermSMA.slice(-1)[0],
    "Long Term SMA": longTermSMA.slice(-1)[0],
    "Short Term SMA Signal": shortTermSMA.slice(-1)[0] > longTermSMA.slice(-1)[0] ? '+' : '-',
    "RSI": rsiValues.slice(-1)[0],
    "RSI Signal": rsiValues.slice(-1)[0] < 70 && rsiValues.slice(-1)[0] > 30 ? '+' : '-',
    "MACD Line": macdValues.slice(-1)[0].MACD,
    "MACD Signal": macdValues.slice(-1)[0].MACD > macdValues.slice(-1)[0].signal ? '+' : '-',
    "BB Upper": bbValues.slice(-1)[0].upper,
    "BB Lower": bbValues.slice(-1)[0].lower,
    "Volume": volumes[volumes.length - 1],
    "Volume SMA": volumeSMA.slice(-1)[0],
    "Volume Signal": volumes[volumes.length - 1] > volumeSMA.slice(-1)[0] ? '+' : '-',
  };

  console.table({
    'Name': latestValues.Name,
    "Short Term SMA": `${latestValues["Short Term SMA"]} (${latestValues["Short Term SMA Signal"]})`,
    "Long Term SMA": latestValues["Long Term SMA"],
    RSI: `${latestValues.RSI} (${latestValues["RSI Signal"]})`,
    "MACD Line": latestValues["MACD Line"],
    "MACD Signal": `${latestValues["MACD Signal"]})`,
    "BB Upper": latestValues["BB Upper"],
    "BB Lower": latestValues["BB Lower"],
    "Volume": `${latestValues.Volume} (${latestValues["Volume Signal"]})`,
  });

  const analysis = explainIndicatorAnalysis(latestValues);
  console.log(`\nAnalysis for ${cryptoId}:`, analysis);
}

// Run Analysis
analyzeCryptoTrendWithIndicators('bitcoin');
analyzeCryptoTrendWithIndicators('ethereum');
analyzeCryptoTrendWithIndicators('solana');

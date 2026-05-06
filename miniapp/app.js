(function () {
  const tg = window.Telegram && window.Telegram.WebApp;
  if (tg) {
    tg.ready();
    tg.expand();
  }

  const ids = [
    "price",
    "engine",
    "year",
    "hp",
    "customCosts",
    "transferCosts",
    "delivery",
    "rate",
  ];

  const el = Object.fromEntries(ids.map((id) => [id, document.getElementById(id)]));
  const out = {
    duty: document.getElementById("duty"),
    recycling: document.getElementById("recycling"),
    turnkey: document.getElementById("turnkey"),
    rub: document.getElementById("rub"),
  };

  function num(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }

  function fmt(v) {
    return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 }).format(v);
  }

  function customsDuty(price, engine, year) {
    const age = new Date().getFullYear() - year;
    let value;

    if (age > 5) {
      if (engine <= 1000) value = engine * 3;
      else if (engine <= 1500) value = engine * 3.2;
      else if (engine <= 1800) value = engine * 3.5;
      else if (engine <= 2300) value = engine * 4.8;
      else if (engine <= 3000) value = engine * 5;
      else value = engine * 5.7;
    } else if (age >= 3) {
      if (engine <= 1000) value = engine * 1.5;
      else if (engine <= 1500) value = engine * 1.7;
      else if (engine <= 1800) value = engine * 2.5;
      else if (engine <= 2300) value = engine * 2.7;
      else if (engine <= 3000) value = engine * 3;
      else value = engine * 3.6;
    } else {
      const p = price * (price <= 8500 ? 0.54 : 0.48);
      let byEngine;
      if (price <= 8500) byEngine = engine * 2.5;
      else if (price <= 16700) byEngine = engine * 3.5;
      else if (price <= 42300) byEngine = engine * 5.5;
      else if (price <= 84500) byEngine = engine * 7.5;
      else if (price <= 169000) byEngine = engine * 15;
      else byEngine = engine * 20;
      value = Math.max(p, byEngine);
    }

    return value * 0.5;
  }

  const powerBreaks = [0, 160.000001, 190.000001, 220.000001, 250.000001, 280.000001, 310.000001, 340.000001, 370.000001, 400.000001, 430.000001, 460.000001, 500.000001];
  const engineBreaks = [0, 1000.000001, 2000.000001, 3000.000001, 3500.000001];

  const tableUnder3 = [
    [3400, 3400, 3400, 2584000, 3290600],
    [307200, 900000, 2306800, 2635200, 3345600],
    [316800, 952800, 2364000, 2688000, 3403200],
    [324000, 1010400, 2402400, 2743200, 3460800],
    [345600, 1142400, 2520000, 2810400, 3530400],
    [345600, 1291200, 2620800, 2880000, 3600000],
    [345600, 1459200, 2726400, 3038400, 3727200],
    [345600, 1663200, 2834400, 3206400, 3857600],
    [345600, 1896000, 2949600, 3384000, 3993600],
    [345600, 2160000, 3067200, 3568800, 4132800],
    [345600, 2464800, 3189600, 3765600, 4276800],
    [345600, 2808000, 3316800, 3972000, 4425600],
    [345600, 3201600, 3448800, 4190400, 4581600],
  ];

  const tableOverEq3 = [
    [5200, 5200, 5200, 3956200, 4325800],
    [568800, 1492800, 3456000, 4000800, 4389600],
    [585600, 1584000, 3501600, 4044000, 4456800],
    [602400, 1677600, 3552000, 4087200, 4524000],
    [602400, 1838400, 3660000, 4144800, 4627200],
    [602400, 2011200, 3770400, 4248000, 4732800],
    [602400, 2203200, 3873600, 4356000, 4992000],
    [602400, 2412000, 3981600, 4485600, 5268000],
    [602400, 2640000, 4094400, 4620000, 5558400],
    [602400, 2892000, 4209600, 4759200, 5863200],
    [602400, 3168000, 4327200, 4900800, 6187200],
    [602400, 3468000, 4447200, 5049600, 6528000],
    [602400, 3796800, 4572000, 5200800, 6885600],
  ];

  function matchApprox(v, arr) {
    let idx = 0;
    for (let i = 0; i < arr.length; i += 1) {
      if (v >= arr[i]) idx = i;
      else break;
    }
    return idx;
  }

  function recyclingFee(engine, year, hp) {
    if (!engine || !year || !hp) return 0;
    const age = new Date().getFullYear() - year;
    const table = age < 3 ? tableUnder3 : tableOverEq3;
    const r = matchApprox(hp, powerBreaks);
    const c = matchApprox(engine, engineBreaks);
    return table[r][c];
  }

  function recalc() {
    const price = num(el.price.value);
    const engine = num(el.engine.value);
    const year = num(el.year.value);
    const hp = num(el.hp.value);
    const customCosts = num(el.customCosts.value);
    const transferCosts = num(el.transferCosts.value);
    const delivery = num(el.delivery.value);
    const rate = num(el.rate.value);

    const duty = customsDuty(price, engine, year);
    const recycling = recyclingFee(engine, year, hp);
    const turnkey = price + duty + customCosts + transferCosts + delivery + (rate ? recycling / rate : 0);
    const rub = (price + duty + customCosts + transferCosts + delivery) * rate + recycling;

    out.duty.textContent = fmt(duty);
    out.recycling.textContent = fmt(recycling);
    out.turnkey.textContent = fmt(turnkey);
    out.rub.textContent = fmt(rub);

    if (tg) {
      tg.MainButton.setText("Рассчитано");
      tg.MainButton.show();
    }
  }

  ids.forEach((id) => el[id].addEventListener("input", recalc));
  recalc();
})();

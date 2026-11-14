package com.agriforecasting.data;

import com.agriforecasting.commodity.domain.Commodity;
import com.agriforecasting.commodity.domain.Variety;
import com.agriforecasting.commodity.repository.CommodityRepository;
import com.agriforecasting.commodity.repository.VarietyRepository;
import com.agriforecasting.config.ForecastConfig;
import com.agriforecasting.forecast.domain.ForecastRun;
import com.agriforecasting.forecast.domain.ForecastRunItem;
import com.agriforecasting.forecast.repository.ForecastRunRepository;
import com.agriforecasting.market.domain.District;
import com.agriforecasting.market.domain.Mandi;
import com.agriforecasting.market.domain.State;
import com.agriforecasting.market.repository.DistrictRepository;
import com.agriforecasting.market.repository.MandiRepository;
import com.agriforecasting.market.repository.StateRepository;
import com.agriforecasting.price.domain.PriceObservation;
import com.agriforecasting.price.repository.PriceObservationRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Component
public class DataInitializer implements CommandLineRunner {

    private final StateRepository stateRepository;
    private final DistrictRepository districtRepository;
    private final MandiRepository mandiRepository;
    private final CommodityRepository commodityRepository;
    private final VarietyRepository varietyRepository;
    private final PriceObservationRepository priceObservationRepository;
    private final ForecastRunRepository forecastRunRepository;

    public DataInitializer(StateRepository stateRepository,
                           DistrictRepository districtRepository,
                           MandiRepository mandiRepository,
                           CommodityRepository commodityRepository,
                           VarietyRepository varietyRepository,
                           PriceObservationRepository priceObservationRepository,
                           ForecastRunRepository forecastRunRepository) {
        this.stateRepository = stateRepository;
        this.districtRepository = districtRepository;
        this.mandiRepository = mandiRepository;
        this.commodityRepository = commodityRepository;
        this.varietyRepository = varietyRepository;
        this.priceObservationRepository = priceObservationRepository;
        this.forecastRunRepository = forecastRunRepository;
    }

    @Override
    public void run(String... args) {
        if (stateRepository.count() > 0 || mandiRepository.count() > 0) {
            System.out.println("National dataset already present in database. Skipping prototype seed.");
            return;
        }

        // 1. States
        List<State> states = List.of(
                new State("ka", "Karnataka", "KA"),
                new State("mh", "Maharashtra", "MH"),
                new State("hr", "Haryana", "HR"),
                new State("pb", "Punjab", "PB"),
                new State("ap", "Andhra Pradesh", "AP"),
                new State("gj", "Gujarat", "GJ"),
                new State("mp", "Madhya Pradesh", "MP"),
                new State("up", "Uttar Pradesh", "UP"),
                new State("rj", "Rajasthan", "RJ"),
                new State("tn", "Tamil Nadu", "TN"),
                new State("ts", "Telangana", "TS")
        );
        stateRepository.saveAll(states);

        // 2. Districts
        List<District> districts = List.of(
                new District("ka-kolar", "ka", "Kolar"),
                new District("ka-bangalore", "ka", "Bangalore Urban"),
                new District("ka-belgaum", "ka", "Belgaum"),
                new District("ka-mysore", "ka", "Mysore"),
                new District("mh-nashik", "mh", "Nashik"),
                new District("mh-pune", "mh", "Pune"),
                new District("mh-nagpur", "mh", "Nagpur"),
                new District("mh-ahmednagar", "mh", "Ahmednagar"),
                new District("hr-karnal", "hr", "Karnal"),
                new District("hr-hisar", "hr", "Hisar"),
                new District("hr-sirsa", "hr", "Sirsa"),
                new District("hr-ambala", "hr", "Ambala"),
                new District("hr-rohtak", "hr", "Rohtak"),
                new District("hr-panipat", "hr", "Panipat"),
                new District("hr-gurugram", "hr", "Gurugram"),
                new District("pb-ludhiana", "pb", "Ludhiana"),
                new District("pb-amritsar", "pb", "Amritsar"),
                new District("ap-guntur", "ap", "Guntur"),
                new District("ap-kurnool", "ap", "Kurnool"),
                new District("gj-ahmedabad", "gj", "Ahmedabad"),
                new District("gj-rajkot", "gj", "Rajkot"),
                new District("mp-indore", "mp", "Indore"),
                new District("up-agra", "up", "Agra"),
                new District("rj-jaipur", "rj", "Jaipur"),
                new District("tn-coimbatore", "tn", "Coimbatore"),
                new District("ts-warangal", "ts", "Warangal")
        );
        districtRepository.saveAll(districts);

        // 3. Mandis (29 across India, 7 in Haryana)
        List<Mandi> mandis = List.of(
                new Mandi("kolar-apmc", "ka-kolar", "ka", "Kolar APMC", "Kolar APMC Yard", 13.1367, 78.1292),
                new Mandi("yeshwanthpur-apmc", "ka-bangalore", "ka", "Yeshwanthpur APMC", "Yeshwanthpur Agricultural Market", 13.0189, 77.5456),
                new Mandi("belgaum-apmc", "ka-belgaum", "ka", "Belgaum APMC", "Belgaum APMC Yard", 15.8497, 74.4977),
                new Mandi("mysore-apmc", "ka-mysore", "ka", "Mysore APMC", "Bandipalya APMC Mysore", 12.2816, 76.6698),
                new Mandi("lasalgaon-apmc", "mh-nashik", "mh", "Lasalgaon APMC", "Lasalgaon Onion Market", 20.1472, 74.2267),
                new Mandi("pune-apmc", "mh-pune", "mh", "Pune APMC", "Gultekdi Market Yard Pune", 18.4967, 73.8647),
                new Mandi("nagpur-apmc", "mh-nagpur", "mh", "Nagpur APMC", "Kalamna Market Yard Nagpur", 21.1714, 79.1388),
                new Mandi("ahmednagar-apmc", "mh-ahmednagar", "mh", "Ahmednagar APMC", "Ahmednagar Market Yard", 19.0948, 74.7480),
                new Mandi("karnal-mandi", "hr-karnal", "hr", "Karnal Mandi", "Karnal New Grain Market", 29.6857, 76.9905),
                new Mandi("hisar-mandi", "hr-hisar", "hr", "Hisar Mandi", "Hisar Grain Market", 29.1492, 75.7217),
                new Mandi("sirsa-mandi", "hr-sirsa", "hr", "Sirsa Mandi", "Sirsa APMC Market", 29.5349, 75.0298),
                new Mandi("ambala-mandi", "hr-ambala", "hr", "Ambala Mandi", "Ambala City Grain Market", 30.3782, 76.7767),
                new Mandi("rohtak-mandi", "hr-rohtak", "hr", "Rohtak Mandi", "Rohtak New Grain Market", 28.8955, 76.6066),
                new Mandi("panipat-mandi", "hr-panipat", "hr", "Panipat Mandi", "Panipat APMC Yard", 29.3909, 76.9635),
                new Mandi("gurugram-mandi", "hr-gurugram", "hr", "Gurugram Mandi", "Gurugram Khandsa Anaj Mandi", 28.4595, 77.0266),
                new Mandi("khanna-mandi", "pb-ludhiana", "pb", "Khanna Mandi", "Asia Largest Grain Market Khanna", 30.7022, 76.2198),
                new Mandi("amritsar-mandi", "pb-amritsar", "pb", "Amritsar Mandi", "Bhagtanwala Grain Market", 31.6340, 74.8723),
                new Mandi("guntur-apmc", "ap-guntur", "ap", "Guntur APMC", "Guntur Mirchi Yard", 16.3067, 80.4365),
                new Mandi("kurnool-apmc", "ap-kurnool", "ap", "Kurnool APMC", "Kurnool Agricultural Market Yard", 15.8281, 78.0373),
                new Mandi("ahmedabad-apmc", "gj-ahmedabad", "gj", "Ahmedabad APMC", "Jamalpur APMC Market", 23.0225, 72.5714),
                new Mandi("rajkot-apmc", "gj-rajkot", "gj", "Rajkot APMC", "Bedi Yard Rajkot", 22.3039, 70.8022),
                new Mandi("indore-apmc", "mp-indore", "mp", "Indore APMC", "Choithram Mandi Indore", 22.7196, 75.8577),
                new Mandi("agra-apmc", "up-agra", "up", "Agra APMC", "Fatehabad Road Mandi Agra", 27.1767, 78.0081),
                new Mandi("jaipur-apmc", "rj-jaipur", "rj", "Jaipur APMC", "Muhana Mandi Terminal Jaipur", 26.9124, 75.7873),
                new Mandi("coimbatore-apmc", "tn-coimbatore", "tn", "Coimbatore APMC", "MGR Wholesale Market Coimbatore", 11.0168, 76.9558),
                new Mandi("warangal-apmc", "ts-warangal", "ts", "Warangal APMC", "Enumamula Agricultural Market Yard", 17.9689, 79.5941),
                new Mandi("channapatna-apmc", "ka-kolar", "ka", "Channapatna APMC", "Channapatna Grain Yard", 12.6518, 77.2089),
                new Mandi("malur-apmc", "ka-kolar", "ka", "Malur APMC", "Malur Agricultural Yard", 13.0042, 77.9403),
                new Mandi("srinivaspur-apmc", "ka-kolar", "ka", "Srinivaspur APMC", "Srinivaspur Mango & Tomato Market", 13.3364, 78.2144)
        );
        mandiRepository.saveAll(mandis);

        // 4. Commodities
        List<Commodity> commodities = List.of(
                new Commodity("tomato", "Tomato", "Vegetables", "quintal", "tomato"),
                new Commodity("onion", "Onion", "Vegetables", "quintal", "onion"),
                new Commodity("potato", "Potato", "Vegetables", "quintal", "potato"),
                new Commodity("wheat", "Wheat", "Cereals", "quintal", "wheat"),
                new Commodity("rice", "Rice / Paddy", "Cereals", "quintal", "rice"),
                new Commodity("chilli", "Green / Dry Chilli", "Spices", "quintal", "chilli"),
                new Commodity("soybean", "Soybean", "Oilseeds", "quintal", "soybean"),
                new Commodity("cotton", "Raw Cotton (Kapas)", "Fibre Crops", "quintal", "cotton"),
                new Commodity("mustard", "Mustard Seed", "Oilseeds", "quintal", "mustard"),
                new Commodity("maize", "Maize (Corn)", "Cereals", "quintal", "maize")
        );
        commodityRepository.saveAll(commodities);

        // 5. Varieties
        List<Variety> varieties = List.of(
                new Variety("tomato-hybrid", "tomato", "Hybrid"),
                new Variety("tomato-local", "tomato", "Local / Desi"),
                new Variety("tomato-vaishali", "tomato", "Vaishali"),
                new Variety("onion-red", "onion", "Nashik Red"),
                new Variety("onion-white", "onion", "White"),
                new Variety("onion-garwa", "onion", "Garwa"),
                new Variety("potato-jyoti", "potato", "Kufri Jyoti"),
                new Variety("potato-chandramukhi", "potato", "Chandramukhi"),
                new Variety("potato-chipsona", "potato", "Chipsona"),
                new Variety("wheat-sharbati", "wheat", "Sharbati"),
                new Variety("wheat-lokwan", "wheat", "Lokwan"),
                new Variety("wheat-hd2967", "wheat", "HD-2967"),
                new Variety("rice-basmati", "rice", "Basmati 1121"),
                new Variety("rice-sonamasuri", "rice", "Sona Masuri"),
                new Variety("rice-ir64", "rice", "IR-64"),
                new Variety("chilli-guntur", "chilli", "Guntur Sannam"),
                new Variety("chilli-teja", "chilli", "Teja"),
                new Variety("chilli-byadgi", "chilli", "Byadgi"),
                new Variety("soybean-yellow", "soybean", "Yellow Soybean"),
                new Variety("soybean-js335", "soybean", "JS-335"),
                new Variety("cotton-medium", "cotton", "Medium Staple"),
                new Variety("cotton-shankar6", "cotton", "Shankar-6"),
                new Variety("mustard-black", "mustard", "Black Mustard"),
                new Variety("mustard-pusabold", "mustard", "Pusa Bold"),
                new Variety("maize-yellow", "maize", "Yellow Dent Corn"),
                new Variety("maize-hybrid", "maize", "Hybrid Corn")
        );
        varietyRepository.saveAll(varieties);

        // Map variety multipliers
        Map<String, Double> varietyMultipliers = new HashMap<>();
        varietyMultipliers.put("tomato-hybrid", 1.06);
        varietyMultipliers.put("tomato-local", 0.94);
        varietyMultipliers.put("tomato-vaishali", 1.02);
        varietyMultipliers.put("onion-red", 1.04);
        varietyMultipliers.put("onion-white", 0.96);
        varietyMultipliers.put("onion-garwa", 1.08);
        varietyMultipliers.put("potato-jyoti", 1.05);
        varietyMultipliers.put("potato-chandramukhi", 1.00);
        varietyMultipliers.put("potato-chipsona", 1.12);
        varietyMultipliers.put("wheat-sharbati", 1.15);
        varietyMultipliers.put("wheat-lokwan", 1.02);
        varietyMultipliers.put("wheat-hd2967", 0.98);
        varietyMultipliers.put("rice-basmati", 1.35);
        varietyMultipliers.put("rice-sonamasuri", 1.08);
        varietyMultipliers.put("rice-ir64", 0.92);
        varietyMultipliers.put("chilli-guntur", 1.05);
        varietyMultipliers.put("chilli-teja", 1.15);
        varietyMultipliers.put("chilli-byadgi", 1.25);
        varietyMultipliers.put("soybean-yellow", 1.02);
        varietyMultipliers.put("soybean-js335", 0.98);
        varietyMultipliers.put("cotton-medium", 1.00);
        varietyMultipliers.put("cotton-shankar6", 1.10);
        varietyMultipliers.put("mustard-black", 1.00);
        varietyMultipliers.put("mustard-pusabold", 1.06);
        varietyMultipliers.put("maize-yellow", 1.00);
        varietyMultipliers.put("maize-hybrid", 1.05);

        // 6. Seed Price Observations (90 days ending at ForecastConfig.REFERENCE_DATE = 2026-11-23)
        List<PriceObservation> allObs = new ArrayList<>();
        Map<String, Double> basePrices = Map.of(
                "tomato", 1850.0,
                "onion", 2150.0,
                "potato", 1250.0,
                "wheat", 2350.0,
                "rice", 3200.0,
                "chilli", 14500.0,
                "soybean", 4650.0,
                "cotton", 6400.0,
                "mustard", 5350.0,
                "maize", 1880.0
        );

        for (Mandi m : mandis) {
            for (Commodity c : commodities) {
                double base = basePrices.getOrDefault(c.getId(), 2000.0);
                long seed = (long) Math.abs(Objects.hash(m.getId(), c.getId()));
                Random rand = new Random(seed);

                double mandiOffset = (rand.nextDouble() - 0.5) * (base * 0.15);
                double currentPrice = base + mandiOffset;

                // Find commodity varieties
                List<Variety> commVarieties = varieties.stream()
                        .filter(v -> v.getCommodityId().equals(c.getId()))
                        .toList();

                for (int d = 89; d >= 0; d--) {
                    LocalDate obsDate = ForecastConfig.REFERENCE_DATE.minusDays(d);
                    double change = (rand.nextDouble() - 0.49) * (base * 0.02);
                    currentPrice = Math.max(100.0, currentPrice + change);

                    double modal = Math.round(currentPrice * 100.0) / 100.0;
                    double min = Math.round(modal * 0.92 * 100.0) / 100.0;
                    double max = Math.round(modal * 1.08 * 100.0) / 100.0;
                    double arrivals = Math.round((50.0 + rand.nextDouble() * 150.0) * 10.0) / 10.0;

                    // Standard observation
                    allObs.add(new PriceObservation(
                            m.getId(),
                            c.getId(),
                            "standard",
                            obsDate,
                            min,
                            max,
                            modal,
                            arrivals
                    ));

                    // Variety-specific observations for each variety of this commodity
                    for (Variety v : commVarieties) {
                        double mult = varietyMultipliers.getOrDefault(v.getId(), 1.0);
                        double vModal = Math.round(modal * mult * 100.0) / 100.0;
                        double vMin = Math.round(vModal * 0.92 * 100.0) / 100.0;
                        double vMax = Math.round(vModal * 1.08 * 100.0) / 100.0;
                        double vArrivals = Math.round((arrivals / (commVarieties.size() + 0.5)) * 10.0) / 10.0;

                        allObs.add(new PriceObservation(
                                m.getId(),
                                c.getId(),
                                v.getId(),
                                obsDate,
                                vMin,
                                vMax,
                                vModal,
                                vArrivals
                        ));
                    }
                }
            }
        }
        priceObservationRepository.saveAll(allObs);

        // 7. Seed Initial Trustworthy Forecast Runs for Prediction History
        seedInitialForecastRuns();
    }

    private void seedInitialForecastRuns() {
        if (forecastRunRepository.count() > 0) return;

        LocalDate refDate = ForecastConfig.REFERENCE_DATE; // 2026-11-23
        LocalDateTime genTime = refDate.atTime(10, 15, 0);

        // Run 1: Tomato Hybrid at Kolar APMC
        createAndSaveRun(
                "kolar-apmc", "Kolar APMC", "tomato", "Tomato", "tomato-hybrid", "Hybrid",
                refDate, genTime, 1907.84, 2180.72, 2851.09, 49.4, "Rising", 1935.63, 3107.69,
                "Prices are expected to increase over the next two weeks according to this forecast.",
                List.of(
                        new double[]{2023.81, 1935.63, 2111.99, 6.1},
                        new double[]{2026.43, 1930.90, 2121.96, 6.2},
                        new double[]{2028.55, 1925.67, 2131.43, 6.3},
                        new double[]{2031.01, 1920.76, 2141.26, 6.5},
                        new double[]{2036.75, 1918.91, 2154.59, 6.8},
                        new double[]{2100.33, 1971.31, 2229.35, 10.1},
                        new double[]{2180.72, 2038.97, 2322.47, 14.3},
                        new double[]{2254.24, 2099.66, 2408.82, 18.2},
                        new double[]{2321.81, 2154.31, 2489.31, 21.7},
                        new double[]{2406.82, 2224.59, 2589.05, 26.2},
                        new double[]{2498.63, 2300.52, 2696.74, 31.0},
                        new double[]{2607.33, 2391.29, 2823.37, 36.7},
                        new double[]{2725.39, 2489.84, 2960.94, 42.9},
                        new double[]{2851.09, 2594.49, 3107.69, 49.4}
                )
        );

        // Run 2: Wheat Sharbati at Karnal Mandi
        createAndSaveRun(
                "karnal-mandi", "Karnal Mandi", "wheat", "Wheat", "wheat-sharbati", "Sharbati",
                refDate, genTime.minusHours(1), 2415.50, 2498.20, 2680.40, 11.0, "Rising", 2350.00, 2780.00,
                "Prices are expected to increase over the next two weeks according to this forecast.",
                List.of(
                        new double[]{2430.00, 2350.00, 2510.00, 0.6},
                        new double[]{2442.00, 2360.00, 2525.00, 1.1},
                        new double[]{2455.00, 2370.00, 2540.00, 1.6},
                        new double[]{2465.00, 2380.00, 2555.00, 2.0},
                        new double[]{2478.00, 2390.00, 2570.00, 2.6},
                        new double[]{2488.00, 2400.00, 2585.00, 3.0},
                        new double[]{2498.20, 2410.00, 2600.00, 3.4},
                        new double[]{2515.00, 2420.00, 2615.00, 4.1},
                        new double[]{2540.00, 2440.00, 2640.00, 5.2},
                        new double[]{2575.00, 2470.00, 2680.00, 6.6},
                        new double[]{2610.00, 2500.00, 2720.00, 8.1},
                        new double[]{2635.00, 2520.00, 2750.00, 9.1},
                        new double[]{2658.00, 2540.00, 2775.00, 10.0},
                        new double[]{2680.40, 2560.00, 2800.00, 11.0}
                )
        );

        // Run 3: Onion Red at Lasalgaon APMC
        createAndSaveRun(
                "lasalgaon-apmc", "Lasalgaon APMC", "onion", "Onion", "onion-red", "Nashik Red",
                refDate, genTime.minusHours(3), 2240.00, 2315.00, 2480.00, 10.7, "Rising", 2180.00, 2590.00,
                "Prices are expected to increase over the next two weeks according to this forecast.",
                List.of(
                        new double[]{2255.00, 2180.00, 2330.00, 0.7},
                        new double[]{2268.00, 2190.00, 2345.00, 1.3},
                        new double[]{2280.00, 2200.00, 2360.00, 1.8},
                        new double[]{2290.00, 2210.00, 2375.00, 2.2},
                        new double[]{2302.00, 2220.00, 2390.00, 2.8},
                        new double[]{2308.00, 2225.00, 2400.00, 3.0},
                        new double[]{2315.00, 2230.00, 2410.00, 3.3},
                        new double[]{2330.00, 2240.00, 2430.00, 4.0},
                        new double[]{2360.00, 2265.00, 2460.00, 5.4},
                        new double[]{2395.00, 2295.00, 2500.00, 6.9},
                        new double[]{2420.00, 2315.00, 2530.00, 8.0},
                        new double[]{2445.00, 2335.00, 2555.00, 9.2},
                        new double[]{2465.00, 2350.00, 2575.00, 10.0},
                        new double[]{2480.00, 2360.00, 2590.00, 10.7}
                )
        );
    }

    private void createAndSaveRun(
            String mandiId, String mandiName, String commId, String commName, String varId, String varName,
            LocalDate refDate, LocalDateTime genTime, double latestActual, double p7, double p14, double pct14,
            String direction, double minP, double maxP, String interp, List<double[]> rawItems) {

        ForecastRun run = new ForecastRun(
                mandiId, mandiName, commId, commName, varId, varName,
                refDate, genTime, ForecastConfig.FORECAST_HORIZON,
                ForecastConfig.FORECAST_START, ForecastConfig.FORECAST_END,
                "LightGBM-AgriPrice-v1", "SUCCESS",
                latestActual, refDate, p7, p14, pct14, direction, minP, maxP, interp, false
        );

        for (int i = 0; i < rawItems.size(); i++) {
            double[] arr = rawItems.get(i);
            LocalDate targetDate = refDate.plusDays(i + 1L);
            ForecastRunItem item = new ForecastRunItem(
                    i + 1, targetDate, arr[0], arr[1], arr[2], arr[3], null
            );
            run.addItem(item);
        }

        forecastRunRepository.save(run);
    }
}

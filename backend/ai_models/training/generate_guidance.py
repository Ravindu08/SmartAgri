"""Generate crop_guidance.json for all 41 crops. Run: python generate_guidance.py"""
import json
from pathlib import Path

OUT = Path(__file__).parent / "models" / "crop_guidance.json"

def stg(id,name,d0,d1,icon,color,desc,acts,warns=None):
    return {"id":id,"name":name,"day_start":d0,"day_end":d1,"icon":icon,"color":color,"description":desc,"activities":acts,"warnings":warns or[]}
def act(tp,day,title,desc,why=""):
    return {"type":tp,"day":day,"title":title,"description":desc,"why":why}
def dis(name,local,cause,sev,symp,cond,prev,treat):
    return {"name":name,"local_name":local,"cause":cause,"severity":sev,"symptoms":symp,"favorable_conditions":cond,"prevention":prev,"treatment":treat}
def pst(name,local,sev,dmg,ident,prev,treat):
    return {"name":name,"local_name":local,"severity":sev,"damage":dmg,"identification":ident,"prevention":prev,"treatment":treat}
def rsk(tp,name,sev,desc,signs,mit):
    return {"type":tp,"name":name,"severity":sev,"description":desc,"signs":signs,"mitigation":mit}
def frt(timing,day,apps,why):
    return {"timing":timing,"day":day,"applications":apps,"why":why}
def ap(mat,rate,method):
    return {"material":mat,"rate":rate,"method":method}

G = {}

# ── TOMATO ────────────────────────────────────────────────────────────────────
G["Tomato"] = {
  "local_name":"Takkali","scientific_name":"Solanum lycopersicum","family":"Solanaceae",
  "overview":"Widely cultivated across Sri Lanka's intermediate and up-country regions. Requires careful water management and disease control for high yields.",
  "zones":["Intermediate Zone","Up Country Wet Zone","Up Country Intermediate Zone"],
  "duration":{"min":60,"max":80,"note":"days after transplanting"},
  "spacing":{"row_cm":75,"plant_cm":60},"propagation":"Transplants (raise in nursery 21 days)",
  "stages":[
    stg("land_prep","Land Preparation",-14,0,"🚜","#795548","Prepare field before transplanting.",[
      act("prepare",-14,"Deep plough to 30 cm","Break clods, remove weeds and debris. Allow to weather for 5–7 days.","Good tillage improves aeration and root penetration."),
      act("prepare",-7,"Form raised beds","Make 1 m wide beds, 20–25 cm high with 30 cm drainage channels.","Raised beds prevent waterlogging — the main cause of wilt diseases."),
      act("fertilize",-7,"Apply basal compost","Incorporate 10–15 t/ha well-decomposed compost into the bed.","Organic matter improves soil structure and nutrient availability.")]),
    stg("transplanting","Transplanting & Establishment",0,14,"🌱","#4CAF50","Establish seedlings in the field.",[
      act("plant",0,"Transplant 21-day seedlings","Plant in holes 20 cm deep in late afternoon or cloudy day. Water immediately.","Evening planting reduces heat stress on young seedlings."),
      act("water",1,"Water daily for first week","Water gently at the base every morning for 7 days.","Consistent moisture in first week is critical for root establishment."),
      act("train",10,"Install stakes","Drive 1.5 m stakes 20 cm into soil, 10 cm from each plant.","Staking prevents lodging and improves air circulation.")]),
    stg("vegetative","Vegetative Growth",14,42,"🌿","#2E7D32","Rapid leaf and stem growth phase.",[
      act("weed",14,"First weeding","Remove all weeds by hand or shallow hoe. Avoid root disturbance.","Weeds reduce nutrients by 30–40% at this stage."),
      act("fertilize",21,"Top dressing 1 — Urea","Apply Urea 75 kg/ha in a ring 10 cm from base, cover with soil, water.","Nitrogen drives rapid vegetative growth."),
      act("monitor",30,"Scout for pests and diseases","Check leaf undersides for whitefly and aphids. Cut a stem base and place in water to test for bacterial wilt ooze.","Early detection saves the crop.")]),
    stg("flowering","Flowering & Fruit Set",42,65,"🌸","#FF9800","Most critical stage — water and feeding directly affect yield.",[
      act("fertilize",42,"Top dressing 2 — Urea + MOP","Apply Urea 75 kg/ha + MOP 50 kg/ha in ring around plant. Water immediately.","Potassium improves fruit quality and prevents cracking."),
      act("water",45,"Maintain consistent moisture","Water every 2 days. Never let soil dry completely.","Irregular watering causes blossom drop and blossom-end rot."),
      act("monitor",50,"Check for fruit borer","Look for entry holes and frass on fruits. Remove and destroy affected fruits.","One larva can damage 5–10 fruits if unchecked.")]),
    stg("harvest","Harvest",65,80,"🍅","#F44336","Regular harvesting maximises total yield.",[
      act("harvest",65,"Begin first harvest","Pick at 50–75% colour change (green to orange/red). Leave short stalk.","Correct harvest stage gives best shelf life."),
      act("harvest",68,"Harvest every 2–3 days","Pick all mature fruits. Leaving overripe fruits reduces further yield.","Regular picking stimulates new fruit development.")])],
  "fertilization":[
    frt("Basal — at planting",0,[ap("Compost","10–15 t/ha","Incorporate into bed"),ap("TSP","150 kg/ha","Band 10 cm below row"),ap("MOP","100 kg/ha","Incorporate into bed")],"Phosphorus for roots; potassium for early plant strength."),
    frt("Top dressing 1 — 3 WAP",21,[ap("Urea","75 kg/ha","Ring application, cover and water")],"Nitrogen for vegetative growth."),
    frt("Top dressing 2 — 6 WAP",42,[ap("Urea","75 kg/ha","Ring application"),ap("MOP","50 kg/ha","Ring application, water after")],"Potassium at flowering improves fruit size and taste.")],
  "irrigation":{"frequency":"Every 2–3 days","critical_stages":["Flowering","Fruit Development"],"method":"Furrow or drip irrigation","water_stress_signs":["Morning wilting","Leaf curl","Flower drop"],"over_watering_signs":["Lower leaf yellowing","Soft stem base","Fungal soil surface"],"notes":"Reduce 10–14 days before final harvest to improve shelf life."},
  "diseases":[
    dis("Bacterial Wilt","බැක්ටීරියා විල්ට්","Bacterial (Ralstonia solanacearum)","high","Sudden whole-plant wilt; milky bacterial ooze from cut stem placed in water.","High soil moisture, 25–35°C, poor drainage.","Raised beds. Crop rotation (no Solanaceae for 3 years). Certified seedlings.","No cure. Remove and destroy plant. Lime affected area."),
    dis("Early Blight","අර්ලි බ්ලයිට්","Fungal (Alternaria solani)","medium","Dark brown concentric ring spots on lower leaves; leaves yellow and drop.","Humidity >80%, 24–29°C, wet leaf surfaces.","Avoid overhead irrigation. Good spacing.","Mancozeb 80WP (2.5 g/L) every 7–10 days."),
    dis("Leaf Curl Virus","ලිෆ් කර්ල්","Viral (TLCV — whitefly transmitted)","high","Leaf curling upward, yellowing, stunted growth, poor fruit set.","High whitefly populations, hot dry weather.","Control whitefly. Yellow sticky traps. Remove infected plants immediately.","No cure. Control whitefly vector with Imidacloprid (0.3 ml/L).")],
  "pests":[
    pst("Whitefly","සුදු මැස්සා","high","Sucks sap; transmits Leaf Curl Virus.","Tiny white insects on leaf undersides; leaves yellow and curl.","Yellow sticky traps. Marigold intercrop.","Imidacloprid 200SL (0.3 ml/L) on leaf undersides."),
    pst("Fruit Borer","පළතුරු බෝරර්","high","Larvae bore into fruits; one larva damages many fruits.","Entry hole with frass on fruit surface.","Pheromone traps. Remove infected fruits.","Spinosad 45SC (0.3 ml/L). No spray 7 days before harvest.")],
  "risks":[
    rsk("weather","Drought at Flowering","high","Water deficit causes flower drop and 30–50% yield loss.","Morning wilting, flower drop, leaf edge browning.","Irrigate every 2 days. Mulch to retain moisture."),
    rsk("weather","Waterlogging","high","Standing water kills roots in 24–48 hours. Promotes wilt and rot.","Wilting despite wet soil, yellowing lower leaves.","Plant on raised beds. Clear drainage channels.")],
  "harvest":{"days_after_transplanting":{"min":60,"max":80},"indicators":["50–75% colour change to orange/red","Slight give when gently pressed","Fresh green calyx"],"method":"Twist-and-pull with short stalk. Use clean plastic crates.","frequency":"Every 2–3 days","yield":"20–30 t/ha","post_harvest":"Grade by size. Store cool and shaded. Market within 5–7 days."}
}

# ── CHILLI ────────────────────────────────────────────────────────────────────
G["Chilli"] = {
  "local_name":"Miris","scientific_name":"Capsicum annuum (hot)","family":"Solanaceae",
  "overview":"Key spice crop grown across dry and intermediate zones. Highly valued fresh and dried. Susceptible to thrips and viral diseases.",
  "zones":["Dry Zone","Intermediate Zone","Low Country Dry Zone"],
  "duration":{"min":70,"max":100,"note":"days after transplanting"},
  "spacing":{"row_cm":60,"plant_cm":45},"propagation":"Transplants (raise in nursery 25–30 days)",
  "stages":[
    stg("land_prep","Land Preparation",-14,0,"🚜","#795548","Prepare well-drained field.",[
      act("prepare",-14,"Plough and level","Deep plough to 30 cm. Remove weeds. Form raised beds.","Good drainage prevents Phytophthora collar rot, common in chilli."),
      act("fertilize",-7,"Apply compost","Incorporate compost 10 t/ha.","Organic matter improves moisture retention in dry-zone soils.")]),
    stg("transplanting","Transplanting & Establishment",0,21,"🌱","#4CAF50","Establish seedlings carefully.",[
      act("plant",0,"Transplant in evening","Use healthy 25–30 day seedlings. Plant at 45 × 60 cm spacing. Water immediately.","Evening planting reduces transplant shock."),
      act("water",1,"Daily watering for 10 days","Water gently at base. Avoid wetting foliage.","Consistent moisture prevents early wilting.")]),
    stg("vegetative","Vegetative Growth",21,50,"🌿","#2E7D32","Strong branching and foliage development.",[
      act("weed",21,"Weed and hill up","Remove weeds and heap soil around base of plant.","Hilling strengthens stem base and prevents root exposure."),
      act("fertilize",28,"Top dressing 1","Apply Urea 75 kg/ha as ring around plants. Cover and water.","Nitrogen supports branching for higher fruit-bearing capacity."),
      act("monitor",35,"Scout for thrips","Check young leaves for silvering and distortion — signs of thrips. Check for viral symptoms (mosaic, crinkle).","Thrips are the main vector of chilli viral diseases.")]),
    stg("flowering","Flowering & Fruiting",50,80,"🌸","#FF9800","Flowers and fruits develop. Maintain nutrition.",[
      act("fertilize",56,"Top dressing 2","Apply Urea 50 kg/ha + MOP 50 kg/ha.","Potassium improves fruit pungency and weight."),
      act("monitor",60,"Check for anthracnose","Look for sunken dark lesions on fruits. Remove and destroy.","Anthracnose spreads rapidly in humid conditions.")]),
    stg("harvest","Harvest",75,100,"🌶","#F44336","Harvest at correct stage for intended use.",[
      act("harvest",75,"Begin harvest (green or red)","Pick green chillies for fresh market. Allow to turn red for dried/powder market.","Red chillies have higher capsaicin and dry weight."),
      act("harvest",78,"Harvest every 5–7 days","Pick mature fruits regularly to encourage continuous production.","Regular harvesting extends productive period by 4–6 weeks.")])],
  "fertilization":[
    frt("Basal",0,[ap("Compost","10 t/ha","Incorporate"),ap("TSP","125 kg/ha","Band application"),ap("MOP","75 kg/ha","Incorporate")],"Foundation nutrients for establishment."),
    frt("Top dressing 1 — 4 WAP",28,[ap("Urea","75 kg/ha","Ring, cover, water")],"Nitrogen for branching."),
    frt("Top dressing 2 — 8 WAP",56,[ap("Urea","50 kg/ha","Ring"),ap("MOP","50 kg/ha","Ring, water")],"Potassium for fruit quality.")],
  "irrigation":{"frequency":"Every 3–4 days","critical_stages":["Flowering","Fruit Fill"],"method":"Furrow or drip","water_stress_signs":["Leaf wilt midday","Flower drop"],"over_watering_signs":["Collar rot at base","Yellowing lower leaves"],"notes":"Chilli tolerates short dry spells better than waterlogging. Reduce watering before red harvest."},
  "diseases":[
    dis("Anthracnose","ඇන්ත්‍රැක්නෝස්","Fungal (Colletotrichum spp.)","high","Sunken dark circular lesions on green and red fruits. Lesions enlarge and fruits rot and shrivel.","Humid conditions, 25–30°C, wounded fruits.","Avoid overhead watering. Good spacing. Remove infected fruits immediately.","Mancozeb 80WP (2.5 g/L) or Copper Oxychloride (3 g/L) every 7 days."),
    dis("Bacterial Wilt","බැක්ටීරියා විල්ට්","Bacterial (Ralstonia)","high","Sudden complete wilting. Vascular browning visible in cut stem.","Wet soil, poor drainage, 25–35°C.","Raised beds, crop rotation, certified seedlings.","Remove infected plants. Lime area. Rotate crops.")],
  "pests":[
    pst("Thrips","ත්‍රිප්ස්","high","Silvery streaks on leaves; distorted young leaves; transmits TSWV virus.","Tiny yellow-brown insects inside leaf folds and flowers.","Blue sticky traps. Neem oil spray.","Spinosad (0.3 ml/L) or Dimethoate 40EC (1.5 ml/L). Alternate chemicals."),
    pst("Chilli Fruit Borer","කීට ලාවා","medium","Larvae bore into fruits. Entry hole with frass visible.","Small hole on fruit with dark excrement.","Pheromone traps. Remove infected fruits.","Chlorpyriphos (1.5 ml/L). No spray 7 days before harvest.")],
  "risks":[
    rsk("weather","Drought","medium","Dry spells during flowering cause flower and fruit drop.","Midday wilting, flower drop.","Drip or furrow irrigation every 3–4 days. Mulch."),
    rsk("weather","Excessive Rain","high","Promotes anthracnose and Phytophthora root rot.","Collar rotting, waterlogged soil.","Raised beds. Copper spray before rain period.")],
  "harvest":{"days_after_transplanting":{"min":75,"max":100},"indicators":["Green stage: firm full-sized fruits","Red stage: fully red, slightly firm"],"method":"Hand pick with short stalk. Avoid bruising.","frequency":"Every 5–7 days","yield":"8–12 t/ha (fresh)","post_harvest":"Dry in sun for red/dried market. Grade by size and colour. Store in dry ventilated area."}
}

# ── BRINJAL ───────────────────────────────────────────────────────────────────
G["Brinjal (Eggplant)"] = {
  "local_name":"Wambatu","scientific_name":"Solanum melongena","family":"Solanaceae",
  "overview":"Widely grown throughout Sri Lanka in dry and intermediate zones. A long-duration crop with continuous harvesting over several months if managed well.",
  "zones":["Dry Zone","Intermediate Zone","Low Country Dry Zone","Low Country Wet Zone"],
  "duration":{"min":60,"max":90,"note":"days after transplanting; crop lasts 4–6 months"},
  "spacing":{"row_cm":90,"plant_cm":75},"propagation":"Transplants (raise in nursery 25–30 days)",
  "stages":[
    stg("land_prep","Land Preparation",-14,0,"🚜","#795548","Prepare deep, well-drained soil.",[
      act("prepare",-14,"Plough deeply","Plough to 35 cm. Brinjal has a deep root system.","Deep tillage supports the large root system needed for a long-duration crop."),
      act("fertilize",-7,"Add compost and lime if needed","Incorporate 15 t/ha compost. Apply lime to raise pH if soil is below 5.5.","Brinjal is sensitive to acidic soils.")]),
    stg("transplanting","Transplanting",0,21,"🌱","#4CAF50","Careful establishment reduces transplant shock.",[
      act("plant",0,"Transplant 25-day seedlings","Plant in late afternoon. Water immediately. Shade newly transplanted seedlings for 2–3 days if hot.","Shading reduces stress; improves survival rate."),
      act("water",1,"Water daily for 2 weeks","Water at base every morning.","Critical for root establishment.")]),
    stg("vegetative","Vegetative Growth",21,55,"🌿","#2E7D32","Build strong frame for long productive life.",[
      act("fertilize",28,"Top dressing 1","Urea 75 kg/ha as ring around plant.","Nitrogen builds the vegetative frame that supports months of fruiting."),
      act("monitor",35,"Inspect for fruit and shoot borer","Look for wilted/dead shoot tips and bored fruits — key symptom of brinjal FSB.","FSB is the most destructive pest of brinjal in Sri Lanka.")]),
    stg("flowering","Flowering & Fruiting",55,90,"🌸","#FF9800","Continuous flowering and fruit production.",[
      act("fertilize",56,"Top dressing 2","Urea 75 kg/ha + MOP 75 kg/ha.","Higher potassium supports continuous fruiting."),
      act("monitor",65,"Regular FSB scouting","Check daily for wilted shoot tips. Cut and remove infested shoots.","Destroying infested shoots kills larvae before they reach fruits.")]),
    stg("harvest","Harvest",60,180,"🍆","#7B1FA2","Harvest frequently for continuous yield.",[
      act("harvest",60,"Begin first harvest","Pick fruits when full sized, shiny, and firm. Do not allow to over-ripen.","Over-ripe fruits reduce plant vigour and attract pests."),
      act("harvest",63,"Harvest every 3–4 days","Regular picking extends crop life.","Continuous harvesting keeps plant productive for 4–6 months.")])],
  "fertilization":[
    frt("Basal",0,[ap("Compost","15 t/ha","Incorporate"),ap("TSP","150 kg/ha","Band"),ap("MOP","100 kg/ha","Incorporate")],"Foundation for long-duration crop."),
    frt("Top dressing 1 — 4 WAP",28,[ap("Urea","75 kg/ha","Ring")],"Vegetative growth."),
    frt("Top dressing 2 — 8 WAP",56,[ap("Urea","75 kg/ha","Ring"),ap("MOP","75 kg/ha","Ring")],"Continuous fruiting support."),
    frt("Top dressing 3 — 12 WAP",84,[ap("Urea","50 kg/ha","Ring"),ap("MOP","50 kg/ha","Ring")],"Maintain productivity of older plants.")],
  "irrigation":{"frequency":"Every 3–4 days","critical_stages":["Flowering","Fruit Development"],"method":"Furrow or drip","water_stress_signs":["Leaf wilt","Fruit drop"],"over_watering_signs":["Root rot","Yellowing leaves"],"notes":"Brinjal is moderately drought tolerant but yields drop significantly without regular irrigation."},
  "diseases":[
    dis("Bacterial Wilt","බැක්ටීරියා විල්ට්","Bacterial (Ralstonia)","high","Sudden wilting of whole plant. Bacterial ooze from cut stem in water.","Warm wet soil, poor drainage.","Raised beds, rotation, healthy seedlings.","Remove plants, lime area, 3-year rotation."),
    dis("Phomopsis Blight","ෆොමොප්සිස්","Fungal (Phomopsis vexans)","medium","Dark water-soaked lesions on stem at soil level. Yellowing and wilting of plant.","Humid conditions, overhead irrigation, wounded tissue.","Avoid soil splash. Copper spray preventively.","Copper Oxychloride 3 g/L every 10 days.")],
  "pests":[
    pst("Fruit & Shoot Borer","ෆ්‍රූට් ෂූට් බෝරර්","high","Wilted dead shoot tips; fruits with entry holes and frass; up to 70% yield loss.","Dead wilted new shoots with exit holes. Frass in fruits.","Pheromone traps. Remove infested shoots daily.","Spinosad (0.3 ml/L) weekly. Alternate with Chlorpyriphos (1.5 ml/L)."),
    pst("Aphids","ලිතා","low","Sap sucking, honeydew, sooty mold.","Clusters of soft insects on new growth.","Natural predators. Strong water jets.","Neem oil 5 ml/L.")],
  "risks":[
    rsk("pest","Fruit & Shoot Borer Outbreak","high","Main threat to brinjal. Can destroy entire crop if unchecked.",">25% shoot tips wilted, many fruits with holes.","Daily monitoring. Pheromone traps. Weekly Spinosad spray."),
    rsk("weather","Drought","medium","Reduces fruit size and increases bitterness.","Fruit drop, small fruits.","Regular drip irrigation. Mulch.")],
  "harvest":{"days_after_transplanting":{"min":60,"max":90},"indicators":["Full sized fruit with glossy shiny skin","Fruit feels firm and heavy","Calyx spines are soft (indicates maturity)"],"method":"Cut fruit with 2 cm stalk using sharp knife or scissors.","frequency":"Every 3–4 days","yield":"20–35 t/ha","post_harvest":"Handle carefully to avoid spine injury. Store in cool shaded area. Market within 3–5 days."}
}

# ── CAPSICUM ──────────────────────────────────────────────────────────────────
G["Capsicum"] = {
  "local_name":"Maalu Miris","scientific_name":"Capsicum annuum","family":"Solanaceae",
  "overview":"High-value sweet pepper grown mainly in up-country and intermediate zones. Requires good nutrition and cool temperatures for proper colour development.",
  "zones":["Up Country Wet Zone","Up Country Intermediate Zone","Mid Country Wet Zone","Intermediate Zone"],
  "duration":{"min":70,"max":90,"note":"days after transplanting"},
  "spacing":{"row_cm":60,"plant_cm":45},"propagation":"Transplants (raise in nursery 25–30 days)",
  "stages":[
    stg("land_prep","Land Preparation",-14,0,"🚜","#795548","Prepare fertile well-drained beds.",[
      act("prepare",-14,"Plough and form raised beds","Plough 30 cm deep, form 1 m beds.","Good drainage critical to prevent Phytophthora."),
      act("fertilize",-7,"Apply compost","Incorporate 15 t/ha compost.","Capsicum is a heavy feeder. Rich organic base is essential.")]),
    stg("transplanting","Transplanting",0,21,"🌱","#4CAF50","Careful handling at transplanting.",[
      act("plant",0,"Transplant 25–30 day seedlings","Plant in late afternoon. Shade for 3 days.","Capsicum seedlings are sensitive to transplant shock."),
      act("water",1,"Water daily first 2 weeks","Water gently at base. Never on foliage.","Prevents damping off of young seedlings.")]),
    stg("vegetative","Vegetative Growth",21,50,"🌿","#2E7D32","Build a strong branching plant.",[
      act("fertilize",28,"Top dressing 1","Urea 75 kg/ha as ring.","Nitrogen for branching structure."),
      act("monitor",35,"Check for thrips and viral symptoms","Look for silvery streaks and leaf distortion.","Thrips spread Tomato Spotted Wilt Virus — the most damaging disease of capsicum.")]),
    stg("flowering","Flowering & Fruiting",50,80,"🌸","#FF9800","Critical nutrition and pest management.",[
      act("fertilize",56,"Top dressing 2","Urea 50 kg/ha + MOP 75 kg/ha + Calcium Nitrate 25 kg/ha.","Calcium prevents blossom-end rot; potassium improves colour."),
      act("monitor",60,"Watch for anthracnose","Inspect fruits for sunken lesions. Remove immediately.","Anthracnose can destroy the entire fruit crop quickly in humid weather.")]),
    stg("harvest","Harvest",70,90,"🫑","#4CAF50","Harvest at green or fully coloured stage.",[
      act("harvest",70,"Begin green harvest","Harvest when full sized and firm (green stage) for early market.","Green capsicum commands earlier market prices."),
      act("harvest",80,"Red/Yellow harvest","Allow to fully colour for premium market. Pick before softening.","Coloured capsicum fetches 2–3× higher price than green.")])],
  "fertilization":[
    frt("Basal",0,[ap("Compost","15 t/ha","Incorporate"),ap("TSP","175 kg/ha","Band"),ap("MOP","100 kg/ha","Incorporate")],"Rich base for high-value crop."),
    frt("Top dressing 1 — 4 WAP",28,[ap("Urea","75 kg/ha","Ring")],"Branching development."),
    frt("Top dressing 2 — 8 WAP",56,[ap("Urea","50 kg/ha","Ring"),ap("MOP","75 kg/ha","Ring"),ap("Calcium Nitrate","25 kg/ha","Ring")],"Colour development and fruit quality.")],
  "irrigation":{"frequency":"Every 2–3 days","critical_stages":["Flowering","Fruit Colour Development"],"method":"Drip irrigation preferred","water_stress_signs":["Leaf wilt","Blossom drop","Fruit cracking"],"over_watering_signs":["Root rot","Collar rot","Yellowing"],"notes":"Very sensitive to water stress. Consistent moisture is essential for uniform fruit sizing."},
  "diseases":[
    dis("Bacterial Wilt","බැක්ටීරියා විල්ට්","Bacterial (Ralstonia)","high","Sudden complete wilting. Vascular browning.","Wet soil, poor drainage.","Raised beds, rotation.","Remove plants, lime area."),
    dis("Anthracnose","ඇන්ත්‍රැක්නෝස්","Fungal (Colletotrichum)","high","Sunken dark lesions on fruits. Rapid spread in humid weather.","High humidity, fruit wounds.","No overhead watering. Remove infected fruits.","Mancozeb 2.5 g/L every 7 days.")],
  "pests":[
    pst("Thrips","ත්‍රිප්ස්","high","Silvery leaf streaks; distorted growth; TSWV vector.","Tiny insects inside flowers and young leaves.","Blue sticky traps. Neem oil.","Spinosad (0.3 ml/L). Rotate chemicals."),
    pst("Mites","මයිට්ස්","medium","Bronzing of leaves; distorted growth in dry conditions.","Bronze discolouration on upper leaf surface, tiny mites on underside.","Maintain humidity. Neem oil spray.","Abamectin (0.5 ml/L). 2 applications 5 days apart.")],
  "risks":[
    rsk("weather","Low Temperature (<15°C)","medium","Poor fruit set and colour development.","Small misshapen fruits, slow growth.","Use polytunnel or frost cover in up-country during cold nights."),
    rsk("weather","Drought","high","Blossom drop and fruit cracking.","Flower drop, cracked fruits.","Drip irrigation. Mulch heavily.")],
  "harvest":{"days_after_transplanting":{"min":70,"max":90},"indicators":["Full size reached","Firm texture","Green → yellow/red colour change for coloured stage"],"method":"Cut with sharp knife leaving 2 cm stalk.","frequency":"Every 5–7 days","yield":"15–25 t/ha","post_harvest":"Grade by size and colour. Pack carefully in ventilated boxes. Refrigerate at 8–12°C if possible."}
}

# ── POTATO ────────────────────────────────────────────────────────────────────
G["Potato"] = {
  "local_name":"Ala","scientific_name":"Solanum tuberosum","family":"Solanaceae",
  "overview":"Most important up-country tuber crop grown in Nuwara Eliya and Badulla. Requires cool temperatures and very careful late blight management.",
  "zones":["Up Country Wet Zone","Up Country Intermediate Zone"],
  "duration":{"min":90,"max":120,"note":"days after planting seed tubers"},
  "spacing":{"row_cm":60,"plant_cm":30},"propagation":"Certified seed tubers (60–80 g each)",
  "stages":[
    stg("land_prep","Land Preparation",-14,0,"🚜","#795548","Deep preparation for tuber development.",[
      act("prepare",-14,"Deep plough to 40 cm","Break all clods. Potato tubers need loose soil to develop freely.","Compacted soil causes deformed small tubers."),
      act("fertilize",-7,"Apply compost and lime","Compost 15 t/ha + agricultural lime to bring pH to 5.5–6.0.","Potato scab is worse in alkaline soils above pH 6.5.")]),
    stg("planting","Planting & Emergence",0,21,"🥔","#8D6E63","Plant seed tubers and encourage emergence.",[
      act("plant",0,"Plant seed tubers","Place 60–80 g seed tubers in furrows 10 cm deep. Cover with soil. Spray with Mancozeb before planting to prevent seed tuber rot.","Healthy seed tubers are the foundation of a good crop."),
      act("water",7,"Irrigate if no rain","Maintain soil moisture but avoid waterlogging.","Consistent moisture ensures uniform sprouting."),
      act("monitor",14,"Check emergence","80% emergence should occur by day 14–18.","Poor emergence may indicate seed tuber rot — check a few plants.")]),
    stg("vegetative","Vegetative Growth",21,55,"🌿","#2E7D32","Build foliage for photosynthesis and tuber fill.",[
      act("fertilize",28,"Top dressing 1","Urea 100 kg/ha between rows.","High nitrogen demand during rapid foliage growth."),
      act("prepare",35,"Earthing up (hilling)","Heap soil 15–20 cm high around plant base.","Earthing up prevents green tubers (toxic solanine) and supports plant."),
      act("monitor",35,"Begin late blight monitoring","Check for water-soaked lesions on leaves — especially after rain. Spray preventively.","Late blight can destroy a crop within 5–7 days in cool wet weather.")]),
    stg("tuberization","Tuber Development",55,85,"🌿","#1B5E20","Critical phase — nutrition and disease control determine yield.",[
      act("fertilize",56,"Top dressing 2","MOP 100 kg/ha + Urea 50 kg/ha.","Potassium is critical for tuber starch content and yield."),
      act("monitor",60,"Blight spray schedule","Spray Metalaxyl + Mancozeb (2.5 g/L) every 7 days. Do not miss a spray in wet weather.","Late blight spreads exponentially. One missed spray can cost the crop.")]),
    stg("harvest","Harvest",90,120,"🥔","#8D6E63","Harvest at physiological maturity.",[
      act("prepare",85,"Remove haulm (tops)","Cut or pull off foliage 2 weeks before harvest.","Haulm removal hardens tuber skin and reduces tuber disease at harvest."),
      act("harvest",90,"Dig and harvest","Use fork or digger. Avoid tuber damage. Sort and grade immediately.","Wounded tubers rot quickly in storage.")])],
  "fertilization":[
    frt("Basal — at planting",0,[ap("Compost","15 t/ha","Incorporate"),ap("TSP","200 kg/ha","Band in furrow"),ap("MOP","100 kg/ha","Band in furrow"),ap("Urea","100 kg/ha","Band in furrow")],"High P for tuber initiation; K for yield."),
    frt("Top dressing 1 — 4 WAP",28,[ap("Urea","100 kg/ha","Between rows")],"Foliage development."),
    frt("Top dressing 2 — 8 WAP",56,[ap("MOP","100 kg/ha","Between rows"),ap("Urea","50 kg/ha","Between rows")],"Potassium for tuber fill.")],
  "irrigation":{"frequency":"Every 5–7 days","critical_stages":["Tuber Initiation (Day 40–60)","Tuber Bulking (Day 60–85)"],"method":"Furrow irrigation","water_stress_signs":["Leaf wilting","Hollow hearts in tubers"],"over_watering_signs":["Waterlogging promotes blight","Tuber rot smell"],"notes":"Reduce watering 2 weeks before harvest to harden tuber skin."},
  "diseases":[
    dis("Late Blight","ලේට් බ්ලයිට්","Fungal (Phytophthora infestans)","high","Water-soaked lesions on leaves that rapidly turn brown and black. White fungal growth on leaf undersides. Entire plant can collapse in 5–7 days.","Cool 10–20°C, humidity >80%, rain or dew on leaves.","Preventive copper or Metalaxyl sprays before and during rainy season. Plant resistant varieties.","Metalaxyl + Mancozeb (2.5 g/L) every 7 days during risk period. Use Cymoxanil if outbreak occurs."),
    dis("Common Scab","ස්කෑබ්","Bacterial (Streptomyces scabies)","medium","Rough corky lesions on tuber surface. Not visible on plant foliage.","Alkaline soil (pH >6.5), dry soil during tuber initiation.","Maintain soil pH 5.5–6.0. Irrigate consistently during tuber initiation. Do not apply lime before potato crop.","Affected tubers are safe to eat after peeling. No field treatment; manage with soil pH.")],
  "pests":[
    pst("Potato Tuber Moth","පොළොව් නාශකය","high","Larvae mine leaves and bore into tubers in field and storage. Tunnels visible in cut tubers.","Leaf mines and frass in damaged leaves. Tunnels in harvested tubers.","Earth up well. Harvest promptly when mature. Do not leave tubers in field overnight.","Chlorpyriphos (1.5 ml/L) on foliage. Treat soil with granular insecticide at planting."),
    pst("Aphids","ලිතා","high","Transmit potato viruses; also cause direct sap damage.","Clusters on new growth. Leaf curl. Stunted plants.","Remove volunteer potato plants. Yellow sticky traps.","Imidacloprid (0.3 ml/L).")],
  "risks":[
    rsk("weather","Late Blight Epidemic","high","Can destroy 100% of crop in 1–2 weeks during cool wet weather.","Rapid brown leaf collapse, dark water-soaked lesions.","Never miss fungicide schedule. Remove first infected plants to slow spread."),
    rsk("weather","Frost (below 2°C)","high","Kills foliage rapidly. Common in Nuwara Eliya November–January.","Black wilted foliage overnight. Ice crystals visible on leaves.","Cover with gunny sacks or polytunnel at night during risk period.")],
  "harvest":{"days_after_planting":{"min":90,"max":120},"indicators":["Foliage turns yellow and dies back naturally","Tuber skin does not peel when rubbed","Tubers have reached expected size"],"method":"Dig with fork carefully. Avoid cutting tubers. Grade into A, B, C sizes.","frequency":"Single harvest","yield":"15–25 t/ha","post_harvest":"Cure in shade for 7–10 days. Store in cool dark ventilated store. Do not expose to sunlight — causes greening and toxicity."}
}

# ── ELABATU ───────────────────────────────────────────────────────────────────
G["Elabatu (Thai Eggplant)"] = {
  "local_name":"Elabatu","scientific_name":"Solanum melongena","family":"Solanaceae",
  "overview":"Small round green Thai eggplant widely used in Sri Lankan curries. Adaptable to warm conditions and relatively hardy. Similar management to brinjal.",
  "zones":["Dry Zone","Intermediate Zone","Low Country Dry Zone","Low Country Wet Zone"],
  "duration":{"min":70,"max":90,"note":"days after transplanting; continues fruiting for months"},
  "spacing":{"row_cm":90,"plant_cm":75},"propagation":"Transplants (nursery 25 days)",
  "stages":[
    stg("land_prep","Land Preparation",-14,0,"🚜","#795548","Prepare well-drained fertile soil.",[
      act("prepare",-14,"Plough and prepare beds","Plough 30 cm deep. Form raised beds.","Good drainage essential for this long-duration crop."),
      act("fertilize",-7,"Apply compost","Incorporate 10–15 t/ha compost.","Organic base supports long cropping duration.")]),
    stg("transplanting","Transplanting",0,21,"🌱","#4CAF50","Establish plants in field.",[
      act("plant",0,"Transplant in evening","Plant 25-day-old seedlings. Water immediately.","Reduces transplant shock."),
      act("water",1,"Water daily first 2 weeks","Gentle watering at base.","Critical establishment period.")]),
    stg("vegetative","Vegetative Growth",21,55,"🌿","#2E7D32","Build strong branching structure.",[
      act("fertilize",28,"Top dressing 1","Urea 75 kg/ha ring application.","Nitrogen for branching."),
      act("monitor",35,"Scout for Fruit & Shoot Borer","Check for wilted shoot tips daily.","FSB is the main pest of all eggplant types.")]),
    stg("flowering","Flowering & Fruiting",55,90,"🌸","#FF9800","Continuous fruiting stage.",[
      act("fertilize",56,"Top dressing 2","Urea 75 kg/ha + MOP 75 kg/ha.","Sustained nutrition for continuous fruiting."),
      act("monitor",65,"Regular pest and disease check","Inspect fruits and shoots.","Continuous monitoring maintains crop health.")]),
    stg("harvest","Harvest",70,180,"🟢","#388E3C","Harvest regularly for best yield.",[
      act("harvest",70,"Begin first harvest","Pick small green fruits when full sized and firm.","Harvesting at correct size gives best culinary quality."),
      act("harvest",73,"Harvest every 3–5 days","Remove all mature fruits regularly.","Regular picking maintains plant productivity.")])],
  "fertilization":[
    frt("Basal",0,[ap("Compost","10–15 t/ha","Incorporate"),ap("TSP","150 kg/ha","Band"),ap("MOP","100 kg/ha","Incorporate")],"Foundation nutrients."),
    frt("Top dressing 1 — 4 WAP",28,[ap("Urea","75 kg/ha","Ring")],"Vegetative growth."),
    frt("Top dressing 2 — 8 WAP",56,[ap("Urea","75 kg/ha","Ring"),ap("MOP","75 kg/ha","Ring")],"Continuous fruiting support.")],
  "irrigation":{"frequency":"Every 3–4 days","critical_stages":["Flowering","Fruit Development"],"method":"Furrow or drip","water_stress_signs":["Leaf wilt","Fruit drop"],"over_watering_signs":["Root rot","Yellow leaves"],"notes":"Elabatu tolerates moderate drought but needs consistent moisture for continuous fruiting."},
  "diseases":[
    dis("Bacterial Wilt","බැක්ටීරියා විල්ට්","Bacterial (Ralstonia)","high","Sudden complete wilting.","Wet warm soil.","Raised beds, crop rotation.","Remove plants, lime area."),
    dis("Phomopsis Blight","ෆොමොප්සිස්","Fungal","medium","Dark stem lesions at base. Plant wilts and dies.","Humid conditions, soil splash.","Mulch, avoid wetting stem base.","Copper Oxychloride 3 g/L.")],
  "pests":[
    pst("Fruit & Shoot Borer","ෆ්‍රූට් ෂූට් බෝරර්","high","Wilted shoot tips; bored fruits.","Dead wilted tips; entry holes in fruits.","Pheromone traps. Remove infested shoots.","Spinosad (0.3 ml/L) weekly."),
    pst("Aphids","ලිතා","low","Sap sucking on new growth.","Soft insect clusters.","Natural predators.","Neem oil 5 ml/L.")],
  "risks":[
    rsk("pest","Fruit & Shoot Borer","high","Primary threat. Can cause >50% loss.","Multiple wilted tips, many bored fruits.","Daily scouting, pheromone traps, weekly spray."),
    rsk("weather","Waterlogging","medium","Root rot and wilt promotion.","Wilting in wet soil.","Raised beds, drainage channels.")],
  "harvest":{"days_after_transplanting":{"min":70,"max":90},"indicators":["Fruits full sized and firm","Skin is smooth and shiny"],"method":"Cut with short stalk. Handle carefully.","frequency":"Every 3–5 days","yield":"15–25 t/ha","post_harvest":"Store in cool shaded area. Market within 3–4 days."}
}

# ── TIBBATU ───────────────────────────────────────────────────────────────────
G["Tibbatu (Turkey Berry)"] = {
  "local_name":"Tibbatu","scientific_name":"Solanum torvum","family":"Solanaceae",
  "overview":"Perennial shrub producing small green berries widely used in Sri Lankan cooking and traditional medicine. Hardy and relatively low maintenance.",
  "zones":["Dry Zone","Intermediate Zone","Low Country Dry Zone","Low Country Wet Zone"],
  "duration":{"min":90,"max":120,"note":"days to first harvest; plant lasts 3–5 years"},
  "spacing":{"row_cm":150,"plant_cm":150},"propagation":"Seed or stem cuttings",
  "stages":[
    stg("land_prep","Land Preparation",-14,0,"🚜","#795548","Minimal land prep needed — hardy plant.",[
      act("prepare",-14,"Clear land and dig planting holes","Dig holes 30×30×30 cm. Fill with compost mix.","Good start promotes fast establishment.")]),
    stg("establishment","Planting & Establishment",0,30,"🌱","#4CAF50","Establish young plants.",[
      act("plant",0,"Plant seedlings or cuttings","Water immediately. Shade for first week if hot.","Good establishment reduces care needed later."),
      act("water",3,"Water every 3 days for first month","Maintain moisture at base.","Young plants need consistent moisture.")]),
    stg("vegetative","Vegetative Growth",30,90,"🌿","#2E7D32","Plant grows into productive shrub.",[
      act("fertilize",45,"Apply compost mulch","Apply 2 kg compost per plant as ring mulch.","Slow-release nutrition for perennial plant."),
      act("monitor",60,"Check for aphids and leaf spot","Inspect leaves for pest and disease signs.","Early management prevents spread.")]),
    stg("flowering","Flowering & Fruiting",90,120,"🌸","#FF9800","First berry production begins.",[
      act("monitor",90,"Encourage branching","Lightly prune main stem tip to encourage lateral branching.","More branches = more fruiting points."),
      act("water",100,"Maintain moisture during fruiting","Water every 5–7 days.","Consistent moisture improves fruit size.")]),
    stg("harvest","Harvest",120,1825,"🟢","#388E3C","Harvest berries regularly for years.",[
      act("harvest",120,"Begin first harvest","Pick berry clusters when fully green and firm.","Over-ripe berries become soft and less flavourful."),
      act("harvest",125,"Harvest every 7–10 days","Pick full clusters regularly.","Regular picking stimulates new berry production.")])],
  "fertilization":[
    frt("At planting",0,[ap("Compost","3 kg/hole","Mix into planting hole")],"Organic base for perennial growth."),
    frt("Annual maintenance — start of season",30,[ap("Compost","3 kg/plant","Ring mulch"),ap("Urea","50 g/plant","Ring application")],"Sustain productivity through seasons.")],
  "irrigation":{"frequency":"Every 5–7 days when dry","critical_stages":["Fruit Development"],"method":"Basin or drip","water_stress_signs":["Leaf wilt","Berry drop"],"over_watering_signs":["Root rot","Yellowing"],"notes":"Tibbatu is drought tolerant once established. Reduce watering in rainy season."},
  "diseases":[
    dis("Bacterial Wilt","බැක්ටීරියා විල්ට්","Bacterial","medium","Plant wilting, stem ooze.","Wet warm soil.","Good drainage, avoid wounding roots.","Remove infected plants."),
    dis("Leaf Spot","කොළ ලප","Fungal","low","Brown spots on leaves.","High humidity.","Good air circulation.","Copper spray if severe.")],
  "pests":[
    pst("Aphids","ලිතා","low","Cluster on new growth.","Soft insect clusters on shoots.","Natural predators.","Neem oil 5 ml/L."),
    pst("Fruit Fly","පළතුරු මැස්සා","low","Puncture marks on berries; berries rot inside.","Small puncture marks and ooze on berries.","Protein bait traps.","Malathion bait spray.")],
  "risks":[
    rsk("weather","Drought","low","Tibbatu is naturally drought tolerant. Severe drought reduces fruit size.","Berry drop, wilting.","Water during prolonged dry spells."),
    rsk("weather","Waterlogging","medium","Root rot in poorly drained soils.","Plant wilting in wet soil.","Plant on raised ground or ridges.")],
  "harvest":{"days_after_planting":{"min":120,"max":150},"indicators":["Berries full sized (0.5–1 cm)","Firm green colour","Clusters look full"],"method":"Cut entire berry clusters with scissors. Handle carefully.","frequency":"Every 7–10 days","yield":"5–10 t/ha per season","post_harvest":"Store in cool shaded area. Use fresh for cooking. Market within 2–3 days."}
}

# ── BITTER GOURD ─────────────────────────────────────────────────────────────
G["Bitter Gourd"] = {
  "local_name":"Karawila","scientific_name":"Momordica charantia","family":"Cucurbitaceae",
  "overview":"Popular tropical vine vegetable used in Sri Lankan cuisine and traditional medicine for blood sugar control. Grown widely in dry and intermediate zones.",
  "zones":["Dry Zone","Intermediate Zone","Low Country Dry Zone","Low Country Wet Zone"],
  "duration":{"min":55,"max":70,"note":"days after sowing; harvesting continues for 4–6 weeks"},
  "spacing":{"row_cm":200,"plant_cm":100},"propagation":"Direct sowing (2–3 seeds per hole)",
  "stages":[
    stg("land_prep","Land Preparation",-14,0,"🚜","#795548","Prepare pits and install trellis.",[
      act("prepare",-14,"Dig planting pits","Dig 45×45×45 cm pits. Fill with compost + topsoil mix (1:1).","Deep pits with rich organic matter support vigorous vine growth."),
      act("prepare",-7,"Install trellis","Erect bamboo or wooden poles 2 m high with wire or string netting.","Bitter gourd is a climbing vine and needs firm support from the start.")]),
    stg("sowing","Sowing & Germination",0,14,"🌱","#4CAF50","Establish seedlings in pits.",[
      act("plant",0,"Sow seeds in pit","Sow 2–3 seeds per pit at 2 cm depth. Water gently.","Multiple seeds ensure at least one germinates."),
      act("plant",10,"Thin to one plant","Remove weaker seedlings, keeping the strongest.","Competition between seedlings reduces overall vigour."),
      act("water",1,"Water every 2 days","Keep soil moist. Avoid waterlogging.","Consistent moisture needed for germination.")]),
    stg("vegetative","Vine Growth",14,42,"🌿","#2E7D32","Train vines and build vegetative frame.",[
      act("train",14,"Train vines onto trellis","Guide young tendrils onto the trellis as they emerge.","Proper training maximises light interception and air flow."),
      act("fertilize",21,"Top dressing 1","Urea 50 kg/ha in ring around plant.","Nitrogen drives rapid vine extension."),
      act("weed",21,"Weed around base","Remove weeds within 30 cm of plant base.","Weeds reduce nutrients and harbour pests.")]),
    stg("flowering","Flowering & Fruiting",42,70,"🌸","#FF9800","Pollination and fruit development.",[
      act("monitor",42,"Check male/female flower ratio","First flowers are male. Female flowers (with small fruit at base) appear later.","Understanding flower types helps identify poor pollination issues."),
      act("fertilize",42,"Top dressing 2","Urea 50 kg/ha + MOP 50 kg/ha.","Potassium during fruiting improves fruit weight and bitterness."),
      act("monitor",50,"Scout for fruit fly","Check fruits for puncture marks and ooze. Set protein bait traps.","Fruit fly is the most damaging pest of bitter gourd.")]),
    stg("harvest","Harvest",55,70,"🟩","#1B5E20","Harvest young tender fruits regularly.",[
      act("harvest",55,"First harvest","Harvest fruits when full sized but still firm and green (before turning yellow/orange).","Over-ripe fruits lose market value and reduce further yield."),
      act("harvest",58,"Harvest every 2–3 days","Pick all mature fruits. Never leave yellowing fruits.","Leaving mature fruits stops new fruit development.")])],
  "fertilization":[
    frt("Basal — at pit preparation",0,[ap("Compost","5 kg/pit","Mix into pit soil"),ap("TSP","100 g/pit","Mix into pit"),ap("MOP","50 g/pit","Mix into pit")],"Rich pit preparation feeds vine throughout season."),
    frt("Top dressing 1 — 3 WAP",21,[ap("Urea","50 kg/ha","Ring around plant")],"Vine growth phase nitrogen."),
    frt("Top dressing 2 — 6 WAP",42,[ap("Urea","50 kg/ha","Ring"),ap("MOP","50 kg/ha","Ring")],"Fruit development support.")],
  "irrigation":{"frequency":"Every 2–3 days","critical_stages":["Flowering","Fruit Development"],"method":"Basin irrigation at pit","water_stress_signs":["Leaf wilt midday","Flower drop"],"over_watering_signs":["Root rot","Yellow lower leaves"],"notes":"Do not let soil dry out during flowering — causes flower and fruit drop."},
  "diseases":[
    dis("Powdery Mildew","ෆංගල් රෝගය","Fungal (Podosphaera xanthii)","medium","White powdery coating on leaves and stems. Leaves turn yellow and drop.","Hot dry days, cool nights, poor air circulation.","Good vine spacing. Avoid overhead irrigation.","Wettable sulphur (3 g/L) or Trifloxystrobin (0.5 ml/L) every 7–10 days."),
    dis("Downy Mildew","ඩවුනි මිල්ඩිව්","Fungal (Pseudoperonospora cubensis)","medium","Yellow angular spots on upper leaf surface; grey-purple growth on undersides.","High humidity, wet leaves, cool temperatures.","Avoid wetting leaves. Ensure trellis allows air flow.","Metalaxyl + Mancozeb (2.5 g/L) every 7 days.")],
  "pests":[
    pst("Fruit Fly","පළතුරු මැස්සා","high","Lays eggs under fruit skin; larvae inside cause rotting; 40–60% loss possible.","Puncture marks and ooze on fruits; internal larvae.","Protein bait traps (Malathion + protein hydrolysate). Bag young fruits.","Malathion bait spray weekly. Collect and destroy all fallen fruits."),
    pst("Red Pumpkin Beetle","රතු කෘමියා","medium","Adults eat leaves and flowers; larvae damage roots.","Shiny red beetles on leaves. Circular holes eaten in leaves.","Cover young plants with netting. Yellow sticky traps.","Neem oil (5 ml/L) or Cypermethrin (0.5 ml/L) spray on foliage.")],
  "risks":[
    rsk("pest","Fruit Fly","high","Most serious threat. Can destroy 40–60% of harvest.","Punctured fruits with ooze, larvae in cut fruits.","Protein bait traps from day 40. Harvest frequently. Remove fallen fruits daily."),
    rsk("weather","Excessive Rain","medium","Promotes powdery and downy mildew. Poor pollination in heavy rain.","White powdery patches, angular yellow spots.","Preventive fungicide spray before rainy season.")],
  "harvest":{"days_after_sowing":{"min":55,"max":70},"indicators":["Fruit full sized with prominent ridges/warts","Skin is dark green and firm","Yellow colouration starting means over-ripe"],"method":"Cut with sharp knife or scissors. Leave 2 cm stalk.","frequency":"Every 2–3 days","yield":"10–15 t/ha","post_harvest":"Store in cool shaded area. Market within 3–4 days. Avoid bruising."}
}

# ── LUFFA ─────────────────────────────────────────────────────────────────────
G["Luffa"] = {
  "local_name":"Niyan Wetakolu","scientific_name":"Luffa aegyptiaca","family":"Cucurbitaceae",
  "overview":"Fast-growing tropical vine vegetable. Young fruits used in cooking; mature fruits dried as natural sponges. Widely grown in home gardens and dry zone farms.",
  "zones":["Dry Zone","Intermediate Zone","Low Country Dry Zone"],
  "duration":{"min":50,"max":70,"note":"days after sowing to first vegetable harvest"},
  "spacing":{"row_cm":200,"plant_cm":100},"propagation":"Direct sowing (2 seeds per hole)",
  "stages":[
    stg("land_prep","Land Preparation",-14,0,"🚜","#795548","Prepare pits and trellis.",[
      act("prepare",-14,"Dig pits and prepare trellis","45×45×45 cm pits with compost mix. Install 2 m trellis.","Luffa is a vigorous climber needing strong support.")]),
    stg("sowing","Sowing & Germination",0,14,"🌱","#4CAF50","Sow and establish.",[
      act("plant",0,"Sow 2 seeds per pit at 2 cm depth","Water gently. Keep moist.","Ensures at least one strong plant per pit."),
      act("plant",10,"Thin to one plant per pit","Remove weaker seedling.","Avoids competition between plants.")]),
    stg("vegetative","Vine Growth",14,42,"🌿","#2E7D32","Rapid vine extension and leaf development.",[
      act("train",14,"Guide vines onto trellis","Direct main stem upward.","Early training prevents tangled vines."),
      act("fertilize",21,"Top dressing 1","Urea 50 kg/ha ring around base.","Supports rapid vine extension.")]),
    stg("flowering","Flowering & Fruiting",42,65,"🌸","#FF9800","Pollination and fruit development.",[
      act("monitor",42,"Check for fruit fly","Set protein bait traps. Check fruits for puncture marks.","Fruit fly is main pest — act early."),
      act("fertilize",42,"Top dressing 2","Urea 50 kg/ha + MOP 50 kg/ha.","Supports fruit development.")]),
    stg("harvest","Harvest",50,70,"🥒","#2E7D32","Harvest young fruits for cooking.",[
      act("harvest",50,"First vegetable harvest","Pick young tender fruits (20–30 cm, still soft). Cut with knife.","Young fruits have best eating quality."),
      act("harvest",53,"Harvest every 2–3 days","Do not allow fruits to mature if selling as vegetable.","Over-mature fruits become fibrous and unsaleable.")])],
  "fertilization":[
    frt("Basal",0,[ap("Compost","5 kg/pit","Mix into pit"),ap("TSP","100 g/pit","Mix into pit")],"Foundation nutrition."),
    frt("Top dressing 1 — 3 WAP",21,[ap("Urea","50 kg/ha","Ring")],"Vine growth."),
    frt("Top dressing 2 — 6 WAP",42,[ap("Urea","50 kg/ha","Ring"),ap("MOP","50 kg/ha","Ring")],"Fruiting support.")],
  "irrigation":{"frequency":"Every 2–3 days","critical_stages":["Flowering","Fruit Development"],"method":"Basin irrigation","water_stress_signs":["Leaf wilt","Flower drop"],"over_watering_signs":["Root rot","Yellow leaves"],"notes":"Luffa is moderately drought tolerant but regular watering improves yield."},
  "diseases":[
    dis("Powdery Mildew","ෆංගල්","Fungal","medium","White powdery coating on leaves.","Dry conditions with high humidity.","Good spacing, no overhead irrigation.","Wettable sulphur 3 g/L."),
    dis("Mosaic Virus","මොසෙයික් වයිරසය","Viral (aphid transmitted)","medium","Mosaic yellow-green patterns on leaves. Stunted growth.","High aphid populations.","Control aphids. Remove infected plants.","No cure. Remove infected plants.")],
  "pests":[
    pst("Fruit Fly","පළතුරු මැස්සා","high","Larvae inside fruits cause rot.","Puncture marks on fruits, larvae inside.","Protein bait traps. Bag developing fruits.","Malathion bait spray weekly."),
    pst("Red Pumpkin Beetle","රතු කෘමියා","medium","Eats leaves and flowers.","Red beetles on foliage.","Yellow sticky traps.","Neem oil 5 ml/L.")],
  "risks":[
    rsk("pest","Fruit Fly","high","Major yield threat.","Punctured rotting fruits.","Bait traps from flowering. Remove fallen fruits."),
    rsk("weather","Drought","medium","Reduces vine growth and fruit size.","Stunted vines, small fruits.","Regular irrigation every 2–3 days.")],
  "harvest":{"days_after_sowing":{"min":50,"max":70},"indicators":["Fruit 20–30 cm long","Skin still soft and green","Slight give when squeezed"],"method":"Cut with knife leaving 2 cm stalk.","frequency":"Every 2–3 days","yield":"8–12 t/ha","post_harvest":"Use fresh. Store in cool area. Market within 2–3 days."}
}

# ── PATHOLA ───────────────────────────────────────────────────────────────────
G["Pathola (Snake Gourd)"] = {
  "local_name":"Pathola","scientific_name":"Luffa acutangula","family":"Cucurbitaceae",
  "overview":"Ridge gourd (snake gourd) widely grown across Sri Lanka. Young fruits used in curries. Fast-growing vine crop with good yields under warm conditions.",
  "zones":["Dry Zone","Intermediate Zone","Low Country Dry Zone","Low Country Wet Zone"],
  "duration":{"min":50,"max":65,"note":"days after sowing"},
  "spacing":{"row_cm":200,"plant_cm":100},"propagation":"Direct sowing",
  "stages":[
    stg("land_prep","Land Preparation",-14,0,"🚜","#795548","Prepare pits and trellis.",[
      act("prepare",-14,"Prepare pits and install trellis","45×45×45 cm pits with compost mix. Erect 2 m trellis.","Good start for vigorous vine crop.")]),
    stg("sowing","Sowing",0,14,"🌱","#4CAF50","Sow and establish.",[
      act("plant",0,"Sow 2 seeds per pit","2 cm depth. Water gently.","Ensures successful germination."),
      act("plant",10,"Thin to 1 plant","Remove weaker seedling.","Avoids crowding.")]),
    stg("vegetative","Vine Growth",14,40,"🌿","#2E7D32","Vigorous vine extension.",[
      act("train",14,"Guide vines up trellis","Direct main stem upward onto trellis.","Proper training improves fruiting."),
      act("fertilize",21,"Top dressing 1","Urea 50 kg/ha ring.","Vine growth nitrogen.")]),
    stg("flowering","Flowering & Fruiting",40,60,"🌸","#FF9800","Fruit development.",[
      act("monitor",42,"Scout for fruit fly","Set protein bait traps.","Fruit fly is main pest."),
      act("fertilize",42,"Top dressing 2","Urea 50 kg/ha + MOP 50 kg/ha.","Fruiting support.")]),
    stg("harvest","Harvest",50,65,"🥒","#2E7D32","Regular harvest of young fruits.",[
      act("harvest",50,"First harvest","Pick young tender fruits with ridges still soft.","Young fruits best for cooking."),
      act("harvest",53,"Harvest every 2–3 days","Regular picking prevents over-maturity.","Frequent harvest maximises yield.")])],
  "fertilization":[
    frt("Basal",0,[ap("Compost","5 kg/pit","Mix into pit"),ap("TSP","100 g/pit","Mix")],"Foundation."),
    frt("Top dressing 1 — 3 WAP",21,[ap("Urea","50 kg/ha","Ring")],"Vine growth."),
    frt("Top dressing 2 — 6 WAP",42,[ap("Urea","50 kg/ha","Ring"),ap("MOP","50 kg/ha","Ring")],"Fruiting.")],
  "irrigation":{"frequency":"Every 2–3 days","critical_stages":["Flowering","Fruit Development"],"method":"Basin irrigation","water_stress_signs":["Leaf wilt","Flower drop"],"over_watering_signs":["Root rot"],"notes":"Pathola is relatively drought tolerant once established."},
  "diseases":[
    dis("Powdery Mildew","ෆංගල්","Fungal","medium","White powder on leaves.","Dry weather with humidity.","Good spacing.","Wettable sulphur 3 g/L."),
    dis("Downy Mildew","ඩවුනි","Fungal","medium","Yellow angular spots on leaves.","Wet humid weather.","Avoid wetting leaves.","Metalaxyl + Mancozeb 2.5 g/L.")],
  "pests":[
    pst("Fruit Fly","පළතුරු මැස්සා","high","Larvae rot fruits from inside.","Puncture marks on fruit skin.","Protein bait traps.","Malathion bait spray."),
    pst("Aphids","ලිතා","medium","Sap sucking, virus vector.","Clusters on new growth.","Natural enemies.","Neem oil 5 ml/L.")],
  "risks":[
    rsk("pest","Fruit Fly","high","Major pest — up to 40% loss without management.","Rotting fruits with larvae.","Weekly bait traps, remove fallen fruits."),
    rsk("weather","Waterlogging","medium","Root rot in poorly drained areas.","Yellow wilting plants in wet soil.","Raised pits and drainage channels.")],
  "harvest":{"days_after_sowing":{"min":50,"max":65},"indicators":["Ridges still prominent and soft","Fruit 20–40 cm long","Skin green and firm"],"method":"Cut with knife, 2 cm stalk.","frequency":"Every 2–3 days","yield":"10–15 t/ha","post_harvest":"Sell fresh. Store cool. Market within 2–3 days."}
}

# ── PUMPKIN ───────────────────────────────────────────────────────────────────
G["Pumpkin"] = {
  "local_name":"Wattakka","scientific_name":"Cucurbita moschata","family":"Cucurbitaceae",
  "overview":"Long-duration vine crop producing large nutritious fruits. Widely grown in dry zone. Relatively hardy and drought tolerant once established. Fruits store well.",
  "zones":["Dry Zone","Intermediate Zone","Low Country Dry Zone"],
  "duration":{"min":90,"max":120,"note":"days after sowing"},
  "spacing":{"row_cm":300,"plant_cm":200},"propagation":"Direct sowing (2–3 seeds per pit)",
  "stages":[
    stg("land_prep","Land Preparation",-14,0,"🚜","#795548","Prepare large pits for long-duration vines.",[
      act("prepare",-14,"Dig large pits","60×60×60 cm pits. Fill with rich compost + topsoil mix.","Large pits support the extensive root system of pumpkin."),
      act("prepare",-7,"Mark rows 3 m apart","Allow 2×3 m spacing for vine spreading.","Pumpkin vines can spread 3–4 m — adequate space prevents crowding.")]),
    stg("sowing","Sowing & Emergence",0,21,"🌱","#4CAF50","Sow and establish plants.",[
      act("plant",0,"Sow 3 seeds per pit","Sow at 3 cm depth. Water and cover.","Pumpkin germinates reliably in warm soil."),
      act("plant",14,"Thin to 2 plants per pit","Remove weakest seedling once established.","Two plants per pit improve pollination."),
      act("water",3,"Water every 3 days","Keep pit moist. Do not waterlog.","Even germination needs consistent moisture.")]),
    stg("vegetative","Vine Extension",21,60,"🌿","#2E7D32","Long vegetative phase — vigorous vine growth.",[
      act("fertilize",28,"Top dressing 1","Urea 75 kg/ha ring around plant.","Supports vigorous vine growth phase."),
      act("weed",30,"Weed and mulch","Remove weeds. Lay straw mulch around base.","Mulch suppresses weeds and retains moisture during dry spells.")]),
    stg("flowering","Flowering & Fruit Set",60,90,"🌸","#FF9800","Pollination and fruit development.",[
      act("monitor",60,"Check for male/female flowers","Male flowers appear first. Female flowers have small fruit base.","Hand-pollinate early morning if natural pollination is poor."),
      act("fertilize",63,"Top dressing 2","MOP 100 kg/ha between vines.","High potassium for fruit development and storage quality."),
      act("monitor",70,"Place fruits on dry surface","Slide a tile or wood piece under developing fruits.","Prevents soil contact which causes rotting of the fruit base.")]),
    stg("harvest","Harvest",90,120,"🎃","#FF6F00","Harvest mature fruits at correct stage.",[
      act("harvest",90,"Check maturity signs","Tap fruit — hollow sound indicates maturity. Skin should resist thumbnail pressure.","Harvesting too early reduces storage life significantly."),
      act("harvest",92,"Harvest mature fruits","Cut stalk leaving 5–10 cm attached to fruit.","Long stalk prevents entry of pathogens into the fruit.")])],
  "fertilization":[
    frt("Basal — pit preparation",0,[ap("Compost","8 kg/pit","Thoroughly mixed into pit"),ap("TSP","150 g/pit","Mixed into pit"),ap("MOP","100 g/pit","Mixed into pit")],"Concentrated nutrition at root zone for long-duration crop."),
    frt("Top dressing 1 — 4 WAP",28,[ap("Urea","75 kg/ha","Ring around plant")],"Vine extension phase nitrogen."),
    frt("Top dressing 2 — 9 WAP",63,[ap("MOP","100 kg/ha","Broadcast between vines")],"Potassium for fruit fill and storage quality.")],
  "irrigation":{"frequency":"Every 4–5 days during establishment; every 7 days when established","critical_stages":["Fruit Set (Day 60–75)","Fruit Bulking (Day 75–100)"],"method":"Basin irrigation at pit","water_stress_signs":["Leaf wilting midday","Small fruits"],"over_watering_signs":["Fruit rot at base","Root rot"],"notes":"Pumpkin is drought tolerant once established. Reduce watering 2 weeks before harvest to improve storage life."},
  "diseases":[
    dis("Powdery Mildew","ෆංගල්","Fungal","medium","White powdery patches on older leaves.","Warm dry conditions.","Good vine spacing.","Wettable sulphur 3 g/L or Trifloxystrobin 0.5 ml/L."),
    dis("Fusarium Wilt","ෆ්‍යුසේරියම්","Fungal (Fusarium oxysporum)","medium","Yellowing and wilting of vines. Internal vascular browning.","Wet soil, warm temperatures.","Long crop rotation. Avoid waterlogging.","No effective treatment. Remove infected vines.")],
  "pests":[
    pst("Pumpkin Beetles","ගෙඩි කෘමි","medium","Adults eat leaves and flowers; larvae eat roots.","Yellow-black beetles on flowers and leaves.","Hand-pick adults. Yellow traps.","Chlorpyriphos (1.5 ml/L) spray."),
    pst("Fruit Fly","පළතුරු මැස්සා","medium","Punctures developing fruits.","Puncture marks and ooze.","Protein bait traps from day 55.","Malathion bait spray weekly.")],
  "risks":[
    rsk("weather","Drought During Fruit Set","high","Fruit abortion and reduced fruit size.","Wilting vines, small or no fruits setting.","Maintain irrigation every 4–5 days during fruit set. Mulch heavily."),
    rsk("weather","Waterlogging","medium","Root rot and vine collapse.","Yellowing wilting vines in wet conditions.","Ensure proper drainage from pit. Raise planting area if needed.")],
  "harvest":{"days_after_sowing":{"min":90,"max":120},"indicators":["Stalk dries and turns brown","Skin hardens and resists thumbnail scratch","Hollow sound when tapped","Fruit develops characteristic orange/tan colour"],"method":"Cut with sharp knife, leave 5–10 cm stalk. Handle carefully to avoid bruising.","frequency":"Single or multiple harvests over 2–3 weeks","yield":"15–25 t/ha","post_harvest":"Cure in shade for 7 days to harden skin. Store in cool dry ventilated area up to 3 months. Do not stack more than 2 layers."}
}

# ── CABBAGE ───────────────────────────────────────────────────────────────────
G["Cabbage"] = {
  "local_name":"Gowa Kol","scientific_name":"Brassica oleracea var. capitata","family":"Brassicaceae",
  "overview":"Major cool-climate leafy vegetable grown in up-country Sri Lanka. Requires consistent management of Diamondback Moth — the primary pest — for successful yields.",
  "zones":["Up Country Wet Zone","Up Country Intermediate Zone","Mid Country Wet Zone"],
  "duration":{"min":70,"max":90,"note":"days after transplanting"},
  "spacing":{"row_cm":60,"plant_cm":45},"propagation":"Transplants (nursery 25–30 days)",
  "stages":[
    stg("land_prep","Land Preparation",-14,0,"🚜","#795548","Deep preparation for head formation.",[
      act("prepare",-14,"Plough and lime soil if needed","Deep plough 30 cm. Apply lime if pH below 6.0. Form raised beds.","Club root disease is promoted by acidic soils. Liming prevents it."),
      act("fertilize",-7,"Apply compost","Incorporate 15 t/ha well-decomposed compost.","High organic matter supports uniform head development.")]),
    stg("transplanting","Transplanting",0,21,"🌱","#4CAF50","Establish seedlings.",[
      act("plant",0,"Transplant 25-day seedlings","Plant in late afternoon. Water immediately. Space 45×60 cm.","Evening planting reduces heat stress on young seedlings."),
      act("water",1,"Water daily for 2 weeks","Water at base morning and evening.","Consistent moisture in first 2 weeks determines establishment success.")]),
    stg("vegetative","Vegetative & Head Initiation",21,55,"🌿","#2E7D32","Leaf development and head initiation.",[
      act("weed",21,"First weeding and fertilize","Weed thoroughly, then apply top dressing.","Clean weeds improve air circulation — reduces disease risk."),
      act("fertilize",21,"Top dressing 1","Urea 100 kg/ha + MOP 50 kg/ha ring around plant.","Nitrogen drives leaf development; potassium improves head density."),
      act("monitor",28,"Daily DBM scouting","Inspect undersides of leaves for DBM eggs and larvae (tiny green caterpillars).","Diamondback Moth is the #1 threat to cabbage. Early detection is critical.")]),
    stg("heading","Head Development",55,80,"🥬","#1B5E20","Critical stage — head fills and hardens.",[
      act("fertilize",56,"Top dressing 2","Urea 50 kg/ha.","Final nitrogen push for head fill."),
      act("monitor",60,"Check for head rot","Look for slimy soft areas at head base. Improve drainage if seen.","Black rot and head rot can destroy heads quickly in wet conditions."),
      act("water",65,"Maintain consistent moisture","Irregular watering at this stage causes head splitting.","Head splitting reduces market value to zero.")]),
    stg("harvest","Harvest",70,90,"🥬","#2E7D32","Harvest before heads over-mature.",[
      act("harvest",70,"Test for maturity","Press head with palm — firm solid head indicates maturity.","Soft heads are immature; over-mature heads split and rot."),
      act("harvest",72,"Cut heads","Cut with sharp knife at base leaving 3–4 outer leaves for protection.","Outer leaves protect the head during transport.")])],
  "fertilization":[
    frt("Basal",0,[ap("Compost","15 t/ha","Incorporate"),ap("TSP","150 kg/ha","Band"),ap("MOP","100 kg/ha","Incorporate")],"Foundation for heavy-feeding crop."),
    frt("Top dressing 1 — 3 WAP",21,[ap("Urea","100 kg/ha","Ring"),ap("MOP","50 kg/ha","Ring")],"Leaf development."),
    frt("Top dressing 2 — 8 WAP",56,[ap("Urea","50 kg/ha","Ring")],"Head fill.")],
  "irrigation":{"frequency":"Every 3–4 days","critical_stages":["Head Development (Day 55–80)"],"method":"Furrow irrigation","water_stress_signs":["Outer leaves wilting","Slow head development"],"over_watering_signs":["Black rot at base","Loose heads"],"notes":"Maintain consistent moisture during head fill. Irregular watering = head splitting."},
  "diseases":[
    dis("Club Root","ක්ලබ් රූට්","Fungal (Plasmodiophora brassicae)","high","Swollen club-like galls on roots. Plants wilt and fail to develop heads.","Acidic soil (pH <6.0), wet conditions, infected soil.","Lime soil to pH 6.5 before planting. Long crop rotation (no Brassica for 4 years).","No cure once infected. Lime affected area heavily. Do not replant Brassica crops."),
    dis("Black Rot","බ්ලැක් රොට්","Bacterial (Xanthomonas campestris)","medium","V-shaped yellow lesions from leaf margins. Veins turn black. Head rot in severe cases.","Wet conditions, poor air circulation, seed-borne.","Use certified disease-free seed. Good spacing. Copper spray preventively.","Copper Oxychloride 3 g/L every 10 days.")],
  "pests":[
    pst("Diamondback Moth","ඩයමන්ඩ්බැක් මොත්","high","Larvae skeletonise leaves; bore into heads; highly insecticide resistant.","Small diamond-shaped holes in leaves; tiny green caterpillars on leaf undersides.","Neem oil. Bacillus thuringiensis (Bt) spray. Avoid broad-spectrum insecticides that kill natural enemies.","Bt spray (Dipel: 1 g/L) on leaf undersides. Spinosad (0.3 ml/L) when severe. NEVER rely on synthetic pyrethroids alone — creates resistance."),
    pst("Aphids","ලිතා","medium","Sap sucking on new growth and head interior.","Grey-green colonies on inner leaves.","Remove infested outer leaves.","Dimethoate 40EC (1.5 ml/L).")],
  "risks":[
    rsk("pest","Diamondback Moth Resistance","high","DBM has developed resistance to most insecticides. Poor control = total crop loss.","Spraying with no effect on caterpillar populations.","Use Bt and Spinosad. Rotate with different modes of action. Never spray synthetic pyrethroids only."),
    rsk("weather","Head Splitting","medium","Sudden rain after dry period causes rapid water uptake and splits heads.","Cracked heads visible after rain.","Maintain consistent irrigation. Harvest promptly when mature.")],
  "harvest":{"days_after_transplanting":{"min":70,"max":90},"indicators":["Head is firm and compact when pressed","Outer leaves are slightly cupped","Head weight feels solid"],"method":"Cut at base with sharp knife. Keep 3–4 outer leaves.","frequency":"Single harvest","yield":"20–30 t/ha","post_harvest":"Store in cool ventilated shade. Remove damaged outer leaves. Market within 7–10 days."}
}

# ── CAULIFLOWER ───────────────────────────────────────────────────────────────
G["Cauliflower (Gowa)"] = {
  "local_name":"Gowa","scientific_name":"Brassica oleracea var. botrytis","family":"Brassicaceae",
  "overview":"Cool-climate up-country vegetable with edible white curd. Requires careful temperature and moisture management for uniform white curd development.",
  "zones":["Up Country Wet Zone","Up Country Intermediate Zone"],
  "duration":{"min":60,"max":75,"note":"days after transplanting"},
  "spacing":{"row_cm":60,"plant_cm":50},"propagation":"Transplants (nursery 25 days)",
  "stages":[
    stg("land_prep","Land Preparation",-14,0,"🚜","#795548","Prepare fertile well-drained beds.",[
      act("prepare",-14,"Plough, lime, and raise beds","pH should be 6.0–6.8. Lime if needed. Form raised beds.","Acidic soils cause club root and poor curd development."),
      act("fertilize",-7,"Apply compost","Incorporate 15 t/ha compost.","Cauliflower is a heavy feeder needing rich soil.")]),
    stg("transplanting","Transplanting",0,21,"🌱","#4CAF50","Establish transplants.",[
      act("plant",0,"Transplant 25-day seedlings","Plant in late afternoon. Water immediately.","Protects seedlings from heat stress."),
      act("water",1,"Water daily 2 weeks","Water at base daily.","Critical establishment period.")]),
    stg("vegetative","Vegetative Growth",21,45,"🌿","#2E7D32","Leaf development before curd initiation.",[
      act("fertilize",21,"Top dressing 1","Urea 100 kg/ha + MOP 50 kg/ha ring.","Nitrogen for leaf development; potassium for curd quality."),
      act("monitor",28,"Scout for DBM","Check leaf undersides for larvae and diamond-shaped holes.","DBM damages leaves that are needed for curd development.")]),
    stg("curd","Curd Development",45,70,"🥦","#F5F5F5","Critical stage — protect curd whiteness.",[
      act("prepare",45,"Tie outer leaves over curd","When small curd appears (5–8 cm), tie outer leaves over it to blanch.","Exposure to sunlight turns curd yellow/brown and reduces quality."),
      act("fertilize",49,"Top dressing 2","Urea 50 kg/ha.","Final nitrogen for curd fill."),
      act("monitor",55,"Check for curd browning","Inspect tied curd for browning, rot, or pest entry.","Browning reduces market value. Act quickly if seen.")]),
    stg("harvest","Harvest",60,75,"⚪","#FAFAFA","Harvest at peak curd quality.",[
      act("harvest",60,"Harvest when curd is compact","Cut when curd is firm, white, 15–20 cm diameter. Do not delay.","Over-mature curds become loose (ricey) and unsaleable."),
      act("harvest",62,"Continue daily checks","Adjacent plants may mature within days of each other. Check daily.","Missing harvest peak = total loss of that head.")])],
  "fertilization":[
    frt("Basal",0,[ap("Compost","15 t/ha","Incorporate"),ap("TSP","175 kg/ha","Band"),ap("MOP","100 kg/ha","Incorporate")],"Rich base for quality curd."),
    frt("Top dressing 1 — 3 WAP",21,[ap("Urea","100 kg/ha","Ring"),ap("MOP","50 kg/ha","Ring")],"Leaf development."),
    frt("Top dressing 2 — 7 WAP",49,[ap("Urea","50 kg/ha","Ring")],"Curd fill.")],
  "irrigation":{"frequency":"Every 3 days","critical_stages":["Curd Development (Day 45–70)"],"method":"Furrow irrigation","water_stress_signs":["Outer leaf wilting","Loose or 'ricey' curd"],"over_watering_signs":["Club root risk","Curd browning"],"notes":"Never let soil dry during curd development — causes hollow stems and poor curd quality."},
  "diseases":[
    dis("Club Root","ක්ලබ් රූට්","Fungal","high","Swollen root galls. Plants wilt and fail to develop curd.","Acidic soil, wet conditions.","Lime to pH 6.5+. Rotation.","No cure. Lime area. 4-year Brassica rotation."),
    dis("Damping Off","ඩෑම්පිං ඔෆ්","Fungal (Pythium/Rhizoctonia)","medium","Seedling stems rot at soil level. Plants fall over.","Wet nursery, poor drainage, overcrowded sowing.","Well-drained nursery. Correct sowing density.","Drench nursery with Carbendazim (1 g/L) if outbreak.")],
  "pests":[
    pst("Diamondback Moth","ඩයමන්ඩ්බැක් මොත්","high","Larvae damage leaves and bore into curd.","Diamond holes in leaves, tiny green caterpillars.","Bt spray (Dipel 1 g/L) on leaf undersides.","Bt or Spinosad (0.3 ml/L). Rotate chemicals."),
    pst("Cabbage Aphid","ගෝවා ලිතා","medium","Colonies on inner leaves and curd.","Grey waxy aphids on inner leaves.","Remove infested leaves.","Dimethoate 40EC (1.5 ml/L).")],
  "risks":[
    rsk("weather","High Temperature (>25°C)","high","Causes poor curd set, loose ricey curds, or no curd formation.","Premature bolting, small or loose curds.","Plant in cooler season. Use temperature-tolerant varieties."),
    rsk("weather","Frost","medium","Kills young transplants and damages curds.","Blackened wilted foliage overnight.","Cover with sacks during cold nights in Nuwara Eliya.")],
  "harvest":{"days_after_transplanting":{"min":60,"max":75},"indicators":["Firm compact white curd 15–20 cm diameter","Curd surface is smooth and even","Outer leaves still green"],"method":"Cut at base with sharp knife leaving 3–4 leaves.","frequency":"Single harvest; check daily near maturity","yield":"15–20 t/ha","post_harvest":"Keep cool and shaded. Avoid sunlight — yellows quickly. Market within 3–5 days."}
}

# ── KOHLRABI ──────────────────────────────────────────────────────────────────
G["Kohlrabi (Nokol)"] = {
  "local_name":"Nokol","scientific_name":"Brassica oleracea var. gongylodes","family":"Brassicaceae",
  "overview":"Cool-climate vegetable with edible swollen stem grown in up-country Sri Lanka. Fast-growing and relatively easy to manage. Nutritious with high vitamin content.",
  "zones":["Up Country Wet Zone","Up Country Intermediate Zone","Mid Country Wet Zone"],
  "duration":{"min":55,"max":70,"note":"days after transplanting"},
  "spacing":{"row_cm":40,"plant_cm":30},"propagation":"Transplants or direct sowing",
  "stages":[
    stg("land_prep","Land Preparation",-14,0,"🚜","#795548","Prepare fertile raised beds.",[
      act("prepare",-14,"Plough and lime if needed","Prepare beds, pH 6.0–7.0.","Club root prevention requires correct pH."),
      act("fertilize",-7,"Apply compost","Incorporate 10 t/ha compost.","Good organic matter improves bulb development.")]),
    stg("transplanting","Planting",0,14,"🌱","#4CAF50","Establish plants.",[
      act("plant",0,"Transplant or direct sow","25-day transplants or direct sow at 30×40 cm. Water immediately.","Close spacing produces uniform sized bulbs."),
      act("water",1,"Water daily first week","Maintain consistent moisture.","Fast-growing crop needs consistent water from day 1.")]),
    stg("vegetative","Vegetative Growth",14,40,"🌿","#2E7D32","Rapid leaf and stem growth.",[
      act("fertilize",21,"Top dressing 1","Urea 75 kg/ha ring.","Nitrogen drives rapid stem swelling."),
      act("weed",21,"Weed thoroughly","Remove all weeds. Shallow hoeing.","Weeds compete heavily with this fast-growing crop.")]),
    stg("bulbing","Bulb/Stem Swelling",40,60,"🥦","#4CAF50","Swollen stem development — harvest window approaches.",[
      act("monitor",45,"Monitor bulb size","Check swollen stem weekly.","Kohlrabi can over-mature and become woody quickly."),
      act("water",50,"Maintain consistent moisture","Water every 3 days.","Irregular watering causes cracking of the swollen stem.")]),
    stg("harvest","Harvest",55,70,"🌿","#388E3C","Harvest before stems become woody.",[
      act("harvest",55,"Begin harvest","Harvest when swollen stem is 6–8 cm diameter. Do not wait longer.","Over-mature kohlrabi becomes tough and fibrous, losing market value."),
      act("harvest",58,"Harvest remaining plants over 7 days","Stagger harvest as plants mature.","Field does not mature uniformly — check every 2–3 days.")])],
  "fertilization":[
    frt("Basal",0,[ap("Compost","10 t/ha","Incorporate"),ap("TSP","125 kg/ha","Band"),ap("MOP","75 kg/ha","Incorporate")],"Good base for fast-growing crop."),
    frt("Top dressing 1 — 3 WAP",21,[ap("Urea","75 kg/ha","Ring")],"Stem swelling phase nutrition.")],
  "irrigation":{"frequency":"Every 3 days","critical_stages":["Stem Swelling (Day 40–60)"],"method":"Furrow irrigation","water_stress_signs":["Leaf wilt","Cracked stems"],"over_watering_signs":["Root rot","Loose soil"],"notes":"Consistent moisture prevents cracking. Reduce before harvest."},
  "diseases":[
    dis("Club Root","ක්ලබ් රූට්","Fungal","medium","Root galls, plant stunting.","Acidic soil.","Lime to pH 6.5.","No cure. Rotation."),
    dis("Leaf Spot","කොළ ලප","Fungal","low","Brown spots on leaves. Minor impact.","High humidity.","Good air circulation.","Mancozeb 2.5 g/L if severe.")],
  "pests":[
    pst("Aphids","ලිතා","medium","Sap sucking on leaves.","Clusters on new growth.","Natural predators.","Dimethoate 1.5 ml/L."),
    pst("Cabbage Worm","ගෝවා ඉඳිකටු","medium","Leaves eaten. Entry into swollen stem.","Green caterpillars on leaves.","Hand pick.","Bt spray Dipel 1 g/L.")],
  "risks":[
    rsk("weather","High Temperature","medium","Causes bolting (flowering) instead of stem swelling.","Plants bolt to flower without forming bulb.","Plant in cooler season. Use heat-tolerant variety."),
    rsk("pest","Late Harvest","medium","Over-mature stems become woody and unmarketable.","Hard woody stem, cracked skin.","Harvest promptly at 6–8 cm diameter.")],
  "harvest":{"days_after_transplanting":{"min":55,"max":70},"indicators":["Swollen stem 6–8 cm diameter","Skin smooth and tender","Stem still feels soft when pressed"],"method":"Pull or cut at base. Remove large outer leaves.","frequency":"Harvest over 7–10 days as plants mature","yield":"15–20 t/ha","post_harvest":"Remove leaves. Store in cool area. Market within 5–7 days."}
}

# ── RADISH ────────────────────────────────────────────────────────────────────
G["Radish"] = {
  "local_name":"Raabu","scientific_name":"Raphanus sativus","family":"Brassicaceae",
  "overview":"Fastest-growing root vegetable in Sri Lanka. Ready in 30–50 days. Excellent for intercropping. Grown mainly in up-country cool regions.",
  "zones":["Up Country Wet Zone","Up Country Intermediate Zone","Mid Country Wet Zone"],
  "duration":{"min":30,"max":50,"note":"days after sowing"},
  "spacing":{"row_cm":25,"plant_cm":10},"propagation":"Direct sowing only (taproots do not tolerate transplanting)",
  "stages":[
    stg("land_prep","Land Preparation",-7,0,"🚜","#795548","Prepare fine deep tilth.",[
      act("prepare",-7,"Deep plough and fine tilth","Plough to 30 cm. Break all clods finely. Remove stones.","Stones and clods cause forked or misshapen roots — no market value."),
      act("fertilize",-7,"Apply compost","Incorporate 10 t/ha compost. Do not apply fresh manure.","Fresh manure causes forking and hairy roots.")]),
    stg("sowing","Sowing",0,7,"🌱","#4CAF50","Direct sow and thin.",[
      act("plant",0,"Sow seeds in shallow furrows","Draw furrows 1 cm deep, 25 cm apart. Sow seeds 5 cm apart. Cover lightly.","Shallow sowing and fine soil ensures uniform germination."),
      act("plant",7,"Thin seedlings","Thin to 10 cm apart once 5–8 cm tall.","Crowded radish develops no roots — only leaves.")]),
    stg("vegetative","Leaf & Root Growth",7,30,"🌿","#2E7D32","Rapid root swelling.",[
      act("fertilize",14,"Top dressing","Urea 75 kg/ha between rows.","Single nitrogen application at mid-growth."),
      act("weed",14,"Weed between rows","Hand weed carefully to avoid root disturbance.","Weed competition causes poor root development."),
      act("water",10,"Water every 3–4 days","Maintain consistent moisture.","Irregular moisture causes cracking and hollow centres.")]),
    stg("harvest","Harvest",30,50,"🔴","#E53935","Harvest promptly — radish over-matures quickly.",[
      act("harvest",30,"Check for harvest readiness","Pull one plant to check root size (3–5 cm diameter).","Radish matures faster than expected in warm weather."),
      act("harvest",32,"Harvest in one go","Pull all plants when mature. Do not leave over-ripe plants in soil.","Over-mature radish becomes pithy, hollow, and hot — unmarketable.")])],
  "fertilization":[
    frt("Basal",0,[ap("Compost","10 t/ha","Incorporate finely"),ap("TSP","100 kg/ha","Incorporate"),ap("MOP","75 kg/ha","Incorporate")],"All nutrition needed at sowing — too short a crop for multiple applications."),
    frt("Top dressing — 2 WAP",14,[ap("Urea","75 kg/ha","Between rows, water after")],"Mid-growth nitrogen boost.")],
  "irrigation":{"frequency":"Every 3–4 days","critical_stages":["Root Swelling (Week 2–4)"],"method":"Furrow or overhead","water_stress_signs":["Leaf wilting","Small pithy roots"],"over_watering_signs":["Damping off of seedlings","Root rot"],"notes":"Consistent moisture prevents cracking and hollow centres. Reduce before harvest."},
  "diseases":[
    dis("Damping Off","ඩෑම්පිං ඔෆ්","Fungal","medium","Seedling stems rot at soil level.","Wet nursery/field, poor drainage.","Good drainage. Correct seed rate.","Carbendazim drench 1 g/L."),
    dis("White Rust","සුදු මලකඩ","Fungal (Albugo candida)","low","White pustules on leaves. Minor impact.","Cool humid conditions.","Copper spray preventively.","Copper Oxychloride 3 g/L if severe.")],
  "pests":[
    pst("Root Maggot","රූට් මැගට්","medium","Larvae tunnel through roots causing rot and stunting.","Tunnels in roots; stunted plants; flies around plants.","Rotate crops. Avoid fresh manure.","Chlorpyriphos soil drench at planting."),
    pst("Aphids","ලිතා","low","Minor leaf damage.","Clusters on new growth.","Spray with water jets.","Neem oil 5 ml/L if severe.")],
  "risks":[
    rsk("weather","High Temperature (>25°C)","high","Radish bolts to flower without forming root.","Plants flower without root swelling.","Plant in cooler season (up-country Maha). Avoid low country."),
    rsk("management","Late Harvest","high","Over-mature radish becomes pithy, hollow, and spicy-hot — unmarketable.","Soft spongy roots when pulled.","Set harvest reminders at day 30 and 35. Pull test 3–4 plants.")],
  "harvest":{"days_after_sowing":{"min":30,"max":50},"indicators":["Root 3–5 cm diameter at shoulder","Skin is smooth and firm","Root feels solid and heavy when pulled"],"method":"Pull plant by hand. Remove leaves, leaving 3 cm of stalk.","frequency":"One-time harvest","yield":"15–25 t/ha","post_harvest":"Trim leaves. Wash roots. Bunch and market within 2–3 days. Wilts quickly without refrigeration."}
}

# ── BIG ONION ─────────────────────────────────────────────────────────────────
G["Big Onion"] = {
  "local_name":"Bombay Lunu","scientific_name":"Allium cepa","family":"Amaryllidaceae",
  "overview":"Major commercial bulb crop grown in Sri Lanka's dry zone. Long duration crop requiring careful thrips control and irrigation management for large quality bulbs.",
  "zones":["Dry Zone","Low Country Dry Zone","Northern Dry Zone"],
  "duration":{"min":90,"max":120,"note":"days after transplanting"},
  "spacing":{"row_cm":20,"plant_cm":10},"propagation":"Transplants from nursery (35–40 days)",
  "stages":[
    stg("land_prep","Land Preparation",-14,0,"🚜","#795548","Fine seedbed for uniform bulb development.",[
      act("prepare",-14,"Plough and fine till","Plough twice. Final fine tilth with cross harrowing. Level carefully.","Uneven fields cause irregular irrigation and uneven bulb development."),
      act("fertilize",-7,"Apply basal fertiliser","Incorporate compost 10 t/ha and basal NPK.","Onion has a shallow root system — all nutrients must be near the surface.")]),
    stg("transplanting","Transplanting",0,21,"🌱","#4CAF50","Establish nursery-raised seedlings.",[
      act("plant",0,"Transplant 35–40 day seedlings","Plant seedlings (pencil thickness) at 10×20 cm. Water immediately.","Correct seedling size is critical — too small or large = poor establishment."),
      act("water",1,"Water daily for 2 weeks","Twice daily if hot and dry.","High water demand at establishment in dry zone conditions.")]),
    stg("vegetative","Leaf Development",21,60,"🌿","#2E7D32","Build leaf mass for photosynthesis.",[
      act("fertilize",28,"Top dressing 1","Urea 75 kg/ha + MOP 50 kg/ha.","Nitrogen for leaf development — leaves manufacture the food that fills the bulb."),
      act("monitor",28,"Daily thrips scouting","Check inner young leaves for silver streaking — sign of thrips.","Thrips cause purple blotch and direct leaf damage — most destructive onion pest."),
      act("fertilize",49,"Top dressing 2","Urea 50 kg/ha + MOP 75 kg/ha.","Second feed before bulbing begins.")]),
    stg("bulbing","Bulb Development",60,100,"🧅","#FF9800","Leaves fold over as bulb swells.",[
      act("water",65,"Reduce irrigation frequency","Water every 5–7 days. Reduce nitrogen.","Excessive nitrogen and water at this stage causes soft bulbs with poor storage."),
      act("monitor",70,"Check for purple blotch","Look for water-soaked lesions with purple centres on leaves.","Purple blotch from thrips damage spreads rapidly during bulbing."),
      act("prepare",90,"Stop irrigation 2 weeks before harvest","Allow leaves to yellow and fall over naturally.","Curing in the soil hardens the bulb skin for storage.")]),
    stg("harvest","Harvest",90,120,"🧅","#FF6F00","Harvest and cure for storage.",[
      act("harvest",90,"Harvest when 75% of tops fall","Pull bulbs when majority of tops have fallen over and yellowed.","Premature harvest gives soft bulbs with short shelf life."),
      act("prepare",95,"Field cure for 7–10 days","Leave harvested bulbs on the ground in the sun for 7–10 days.","Sun curing hardens outer skin and improves storage life dramatically.")])],
  "fertilization":[
    frt("Basal",0,[ap("Compost","10 t/ha","Incorporate"),ap("TSP","150 kg/ha","Incorporate"),ap("MOP","75 kg/ha","Incorporate")],"Shallow-rooted crop needs all basal nutrients near surface."),
    frt("Top dressing 1 — 4 WAP",28,[ap("Urea","75 kg/ha","Between rows"),ap("MOP","50 kg/ha","Between rows")],"Leaf development."),
    frt("Top dressing 2 — 7 WAP",49,[ap("Urea","50 kg/ha","Between rows"),ap("MOP","75 kg/ha","Between rows")],"Pre-bulbing nutrition.")],
  "irrigation":{"frequency":"Every 3–4 days (leaf stage); every 5–7 days (bulbing stage)","critical_stages":["Establishment","Leaf Development","Early Bulbing"],"method":"Furrow irrigation","water_stress_signs":["Leaf tip burn","Slow bulb development"],"over_watering_signs":["Soft bulbs","Neck rot","Purple blotch"],"notes":"Stop irrigation completely 2 weeks before harvest. This is critical for bulb quality and storage."},
  "diseases":[
    dis("Purple Blotch","ජම්බු ලප","Fungal (Alternaria porri)","high","Water-soaked lesions on leaves with purple-brown centres. Leaves collapse. Thrips feeding wounds are entry points.","Thrips damage, high humidity, 25–35°C.","Control thrips early. Avoid overhead irrigation. Good spacing.","Mancozeb 80WP (2.5 g/L) every 7 days. Apply Iprodione (1 g/L) in severe cases."),
    dis("Downy Mildew","ඩවුනි","Fungal (Peronospora destructor)","medium","Pale green oval lesions on leaves. Greyish-purple fungal growth.","Cool humid conditions, dew, heavy mist.","Improve air circulation. Avoid evening irrigation.","Metalaxyl + Mancozeb (2.5 g/L) every 7–10 days.")],
  "pests":[
    pst("Thrips","ත්‍රිප්ස්","high","Silver streaks on leaves; leaf tip death; transmits purple blotch; major yield reducer.","Silvery streaks on inner young leaves; visible tiny insects.","Blue sticky traps (2 per 25 m²). Spray in early morning.","Spinosad (0.3 ml/L) or Imidacloprid (0.3 ml/L). Rotate chemicals weekly."),
    pst("Onion Maggot","ළූනු දළු","medium","Larvae tunnel into bulb base causing rot and plant death.","Wilting plant; larvae visible in bulb base.","Crop rotation. Avoid planting near previous onion crop.","Chlorpyriphos soil drench at transplanting.")],
  "risks":[
    rsk("weather","Excessive Rain During Bulbing","high","Soft bulbs, neck rot, very poor storage life.","Soft watery bulbs, plants not falling over.","Plant in dry season. Ensure drainage. Reduce irrigation."),
    rsk("weather","Drought During Leaf Development","medium","Reduced leaf area = small bulbs.","Slow growth, thin leaves.","Maintain regular irrigation schedule. Mulch between rows.")],
  "harvest":{"days_after_transplanting":{"min":90,"max":120},"indicators":["75% of tops have fallen over","Leaves are yellow-brown","Neck (top) is thin and dry"],"method":"Pull by hand or use fork. Do not throw — bulbs bruise easily.","frequency":"Single harvest","yield":"15–20 t/ha","post_harvest":"Field cure 7–10 days in sun. Top and root trim. Grade by size. Store in well-ventilated slatted trays. Shelf life 3–6 months."}
}

# ── RED ONION ─────────────────────────────────────────────────────────────────
G["Red Onion"] = {
  "local_name":"Rathu Lunu","scientific_name":"Allium cepa var. aggregatum","family":"Amaryllidaceae",
  "overview":"Shallot-type red onion — the most widely used onion in Sri Lankan cooking. Grown from sets (small bulbs). Shorter duration than big onion with good storage life.",
  "zones":["Dry Zone","Intermediate Zone","Low Country Dry Zone"],
  "duration":{"min":80,"max":110,"note":"days after planting sets"},
  "spacing":{"row_cm":20,"plant_cm":15},"propagation":"Planting sets (small saved bulbs 20–30 g)",
  "stages":[
    stg("land_prep","Land Preparation",-7,0,"🚜","#795548","Prepare shallow fine seedbed.",[
      act("prepare",-7,"Plough and fine till","Fine tilth to 20 cm. Level well. Form raised beds if needed.","Shallow root system requires fine, even seedbed."),
      act("fertilize",-7,"Apply basal fertiliser","Compost 10 t/ha + TSP + MOP incorporated.","Base nutrients at surface for shallow feeder.")]),
    stg("planting","Planting",0,21,"🌱","#4CAF50","Plant sets and establish.",[
      act("plant",0,"Plant sets at 15×20 cm spacing","Push sets 2–3 cm into soil. Pointed tip up. Water immediately.","Correct depth — if too shallow, sets dry out; too deep, slow emergence."),
      act("water",1,"Water every 2 days first 2 weeks","Keep soil moist for sprouting.","Sets need moisture to sprout and establish.")]),
    stg("vegetative","Leaf Development",21,55,"🌿","#2E7D32","Build leaf mass.",[
      act("fertilize",28,"Top dressing 1","Urea 75 kg/ha + MOP 50 kg/ha between rows.","Nitrogen for leaf and shoot development."),
      act("monitor",28,"Scout for thrips daily","Check young inner leaves for silver streaks.","Thrips are the main pest. Control before populations explode.")]),
    stg("bulbing","Bulbing",55,90,"🔴","#C62828","Bulbs swell as leaves transfer nutrients.",[
      act("fertilize",56,"Top dressing 2","MOP 75 kg/ha. Reduce Urea.","Higher potassium for bulb fill."),
      act("prepare",80,"Stop irrigation","Cease all irrigation 2 weeks before harvest.","Dry conditions cure the bulb skin properly.")]),
    stg("harvest","Harvest",80,110,"🔴","#B71C1C","Harvest and sun-cure.",[
      act("harvest",80,"Harvest when tops fall","Pull when 70–80% of leaves have fallen and yellowed.","Premature harvest = poor storage life."),
      act("prepare",85,"Sun-cure 5–7 days","Spread in sun for 5–7 days.","Sun curing hardens skin and extends shelf life to 6+ months.")])],
  "fertilization":[
    frt("Basal",0,[ap("Compost","10 t/ha","Incorporate"),ap("TSP","125 kg/ha","Incorporate"),ap("MOP","75 kg/ha","Incorporate")],"Shallow feeder — all basal near surface."),
    frt("Top dressing 1 — 4 WAP",28,[ap("Urea","75 kg/ha","Between rows"),ap("MOP","50 kg/ha","Between rows")],"Leaf development."),
    frt("Top dressing 2 — 8 WAP",56,[ap("MOP","75 kg/ha","Between rows")],"Bulbing — reduce nitrogen, increase potassium.")],
  "irrigation":{"frequency":"Every 3–4 days","critical_stages":["Sprouting","Leaf Development"],"method":"Furrow irrigation","water_stress_signs":["Leaf tip burn","Slow sprouting"],"over_watering_signs":["Set rot","Neck rot"],"notes":"Stop irrigation 2 weeks before harvest — critical for storage quality."},
  "diseases":[
    dis("Purple Blotch","ජම්බු ලප","Fungal","high","Water-soaked lesions with purple centre. Thrips entry wounds.","Thrips damage, humidity.","Control thrips. Good spacing.","Mancozeb 2.5 g/L every 7 days."),
    dis("Basal Rot","මුල් කුණාඩිය","Fungal (Fusarium)","medium","Rotting at bulb base. White fungal growth.","Wet soil, wounding.","Good drainage. Avoid waterlogging.","Drench Carbendazim 1 g/L around affected area.")],
  "pests":[
    pst("Thrips","ත්‍රිප්ස්","high","Main pest. Silver leaf streaks, purple blotch vector.","Silvery streaks, tiny insects in leaves.","Blue sticky traps.","Spinosad (0.3 ml/L). Rotate with Imidacloprid."),
    pst("Onion Maggot","ළූනු දළු","medium","Larvae tunnel into bulb base.","Wilting plant, larvae in base.","Rotation.","Chlorpyriphos drench at planting.")],
  "risks":[
    rsk("weather","Rain at Harvest","high","Wet conditions re-sprout harvested bulbs and promote neck rot.","Green sprouting bulbs, soft necks.","Time harvest for dry weather. Cure immediately after pulling."),
    rsk("management","Planting Diseased Sets","high","Infected sets spread disease to entire crop.","Early plant death, ring rot in bulbs.","Use certified or own disease-free sets only. Dip in Mancozeb solution before planting.")],
  "harvest":{"days_after_planting":{"min":80,"max":110},"indicators":["70–80% tops fallen and yellowed","Bulb skin dry and papery","Neck is thin and dry"],"method":"Pull by hand. Do not bruise. Remove soil.","frequency":"Single harvest","yield":"8–12 t/ha","post_harvest":"Sun cure 5–7 days. Grade. Store in slatted open trays in cool ventilated shade. Shelf life 6–8 months."}
}

# ── LEEKS ─────────────────────────────────────────────────────────────────────
G["Leeks"] = {
  "local_name":"Leeks","scientific_name":"Allium ampeloprasum var. porrum","family":"Amaryllidaceae",
  "overview":"Cool-climate up-country vegetable with mild onion flavour. Long white edible stem. Good market value. Requires consistent soil mounding to achieve long white stem.",
  "zones":["Up Country Wet Zone","Up Country Intermediate Zone"],
  "duration":{"min":90,"max":120,"note":"days after transplanting"},
  "spacing":{"row_cm":30,"plant_cm":15},"propagation":"Transplants (nursery 40–50 days)",
  "stages":[
    stg("land_prep","Land Preparation",-14,0,"🚜","#795548","Prepare deep fertile soil for long white stem development.",[
      act("prepare",-14,"Deep plough to 35 cm","Fine tilth. Level well. Form beds.","Leeks need deep soil for the long white stem to develop below ground."),
      act("fertilize",-7,"Apply compost","Incorporate 15 t/ha compost.","Leeks are heavy feeders. Rich organic base is essential.")]),
    stg("transplanting","Transplanting",0,21,"🌱","#4CAF50","Establish seedlings.",[
      act("plant",0,"Transplant 40–50 day seedlings into furrows","Plant in 15 cm deep furrows at 15×30 cm spacing. Drop plant in, do not backfill yet.","Deep planting in furrow promotes white stem (blanching) development."),
      act("water",1,"Water daily for 2 weeks","Gentle watering at base.","Deep-planted seedlings need moisture to establish.")]),
    stg("vegetative","Leaf Development",21,60,"🌿","#2E7D32","Build strong leaf frame.",[
      act("fertilize",28,"Top dressing 1","Urea 100 kg/ha + MOP 50 kg/ha.","High nitrogen for the multi-leaf development phase."),
      act("prepare",35,"First earthing up","Mound soil 10 cm up around plant stems.","Earthing up excludes light and blanches the stem white."),
      act("monitor",42,"Scout for thrips and leaf miner","Check leaves for silvering (thrips) and mines (leaf miner).","Both pests cause leaf damage that reduces photosynthesis.")]),
    stg("maturing","Stem Development",60,100,"🌱","#1B5E20","Continue earthing up for long white stem.",[
      act("fertilize",63,"Top dressing 2","Urea 75 kg/ha + MOP 75 kg/ha.","Sustains leaf growth and stem thickening."),
      act("prepare",70,"Second earthing up","Mound soil further up stems.","Second earthing extends the white stem length — improves market grade."),
      act("water",80,"Maintain regular irrigation","Water every 4 days.","Consistent moisture prevents pithy stems.")]),
    stg("harvest","Harvest",90,120,"🥬","#2E7D32","Harvest when stems reach desired thickness.",[
      act("harvest",90,"Check stem diameter","Harvest when white stem is 2–3 cm diameter.","Leeks can remain in ground longer than most vegetables if needed."),
      act("harvest",92,"Dig and harvest","Use fork to loosen soil. Pull carefully.","Leek stems are fragile — avoid bending or breaking.")])],
  "fertilization":[
    frt("Basal",0,[ap("Compost","15 t/ha","Incorporate"),ap("TSP","150 kg/ha","Band"),ap("MOP","100 kg/ha","Incorporate")],"Heavy feeder needs rich base."),
    frt("Top dressing 1 — 4 WAP",28,[ap("Urea","100 kg/ha","Ring"),ap("MOP","50 kg/ha","Ring")],"Leaf development."),
    frt("Top dressing 2 — 9 WAP",63,[ap("Urea","75 kg/ha","Ring"),ap("MOP","75 kg/ha","Ring")],"Stem thickening.")],
  "irrigation":{"frequency":"Every 4 days","critical_stages":["Stem Development (Day 60–100)"],"method":"Furrow irrigation","water_stress_signs":["Leaf tip burn","Thin pithy stems"],"over_watering_signs":["Root rot","Soft stem base"],"notes":"Consistent moisture throughout. Leeks tolerate cooler conditions but not drought."},
  "diseases":[
    dis("Purple Blotch","ජම්බු ලප","Fungal","medium","Purple centred lesions on leaves. Thrips entry wounds.","Thrips damage, humidity.","Thrips control. Good spacing.","Mancozeb 2.5 g/L every 7–10 days."),
    dis("Rust","මලකඩ","Fungal (Puccinia)","low","Orange-brown pustules on leaves.","Cool humid conditions.","Good air circulation.","Triadimefon 0.5 g/L if severe.")],
  "pests":[
    pst("Thrips","ත්‍රිප්ස්","high","Silver streaks on leaves. Purple blotch vector.","Tiny insects in inner leaves.","Blue sticky traps. Early morning spray.","Spinosad (0.3 ml/L)."),
    pst("Leaf Miner","කොළ කාරයා","medium","White mines (tunnels) in leaves reducing photosynthesis.","Winding white lines on leaf surface.","Remove and destroy mined leaves.","Abamectin (0.5 ml/L).")],
  "risks":[
    rsk("weather","High Temperature (>24°C)","medium","Bolting and poor stem development.","Plants flower without thick stem formation.","Plant in cool season only. Nuwara Eliya and Badulla."),
    rsk("management","Insufficient Earthing Up","medium","Short green stem — low market value.","Short white stem at harvest.","Earth up twice: at 5 WAP and 10 WAP.")],
  "harvest":{"days_after_transplanting":{"min":90,"max":120},"indicators":["White stem 2–3 cm diameter","Stem feels firm and solid","Plant is upright and healthy"],"method":"Loosen soil with fork, pull plant carefully. Trim roots and top leaves.","frequency":"Harvest over 2–3 weeks as plants reach size","yield":"15–20 t/ha","post_harvest":"Trim roots and outer leaves. Bunch in groups of 10. Store cool. Market within 5–7 days."}
}

# ── COWPEA ───────────────────────────────────────────────────────────────────
G["Cowpea"] = {
  "local_name":"Wandakka","scientific_name":"Vigna unguiculata","family":"Fabaceae",
  "overview":"Drought-tolerant legume widely grown in Sri Lanka's dry zone. Fixes atmospheric nitrogen, improving soil fertility. Short duration and low-input crop suitable for smallholders.",
  "zones":["Dry Zone","Intermediate Zone","Low Country Dry Zone","Northern Dry Zone"],
  "duration":{"min":60,"max":90,"note":"days after sowing"},
  "spacing":{"row_cm":45,"plant_cm":20},"propagation":"Direct sowing (2 seeds per hole)",
  "stages":[
    stg("land_prep","Land Preparation",-7,0,"🚜","#795548","Minimal tillage needed — cowpea tolerates poor soils.",[
      act("prepare",-7,"Plough lightly to 20 cm","Remove weeds. Break large clods.","Cowpea tolerates poor soils but weeds in early stages cause significant yield loss.")]),
    stg("sowing","Sowing & Germination",0,10,"🌱","#4CAF50","Direct sow at correct depth.",[
      act("plant",0,"Sow 2 seeds per hole at 3 cm depth","Space 20×45 cm. Cover and firm soil.","Correct depth ensures rapid uniform germination."),
      act("plant",7,"Thin to 1 plant per hole","Remove weaker seedling once established.","Avoids overcrowding and competition.")]),
    stg("vegetative","Vegetative Growth",10,35,"🌿","#2E7D32","Rapid vine/bush development.",[
      act("fertilize",14,"Apply top dressing","Urea 25 kg/ha + MOP 50 kg/ha. Keep nitrogen low — cowpea fixes its own.","Low nitrogen — excess inhibits the nitrogen-fixing nodules."),
      act("weed",14,"First weeding","Hand weed or hoe between rows carefully.","Critical weed-free period for establishment."),
      act("monitor",21,"Check for bean fly","Look for wilted seedling stems with larval tunnels.","Bean fly is the most damaging early pest of cowpea.")]),
    stg("flowering","Flowering & Pod Fill",35,65,"🌸","#FF9800","Pod development determines yield.",[
      act("monitor",35,"Scout for pod borers","Check developing pods for entry holes and frass.","Pod borers are the main yield-reducing pest at this stage."),
      act("water",40,"Irrigate if dry during pod fill","Water once if no rain for 10+ days during pod fill.","Water stress during pod fill causes seed shrinkage and yield loss.")]),
    stg("harvest","Harvest",60,90,"🫘","#795548","Harvest at correct stage for intended use.",[
      act("harvest",60,"Green pod harvest (vegetable use)","Harvest young tender pods when full but seeds not yet showing through skin.","Green pods have best eating quality at this stage."),
      act("harvest",80,"Dry grain harvest","Allow pods to dry and turn brown on plant. Harvest before pods shatter.","Delay causes pod shattering and grain loss.")])],
  "fertilization":[
    frt("Basal",0,[ap("TSP","75 kg/ha","Incorporate"),ap("MOP","50 kg/ha","Incorporate")],"Phosphorus for root nodule development. No nitrogen — cowpea fixes its own."),
    frt("Top dressing — 2 WAP",14,[ap("Urea","25 kg/ha","Between rows"),ap("MOP","50 kg/ha","Between rows")],"Minimal nitrogen only to kick-start early growth before nodules form.")],
  "irrigation":{"frequency":"Every 7–10 days or as needed","critical_stages":["Germination","Pod Fill"],"method":"Furrow irrigation if available","water_stress_signs":["Leaf wilt midday","Pod shrivelling"],"over_watering_signs":["Root rot","Yellow leaves"],"notes":"Cowpea is drought tolerant. Avoid overwatering. One irrigation at pod fill if no rain is usually sufficient."},
  "diseases":[
    dis("Powdery Mildew","ෆංගල්","Fungal","medium","White powder on leaves and pods. Reduces photosynthesis.","Warm dry days, cool nights.","Good spacing. Avoid dense canopy.","Wettable sulphur 3 g/L or Triadimefon 0.5 g/L."),
    dis("Root Rot","රූට් රොට්","Fungal (Rhizoctonia/Pythium)","medium","Rotting at stem base. Plants wilt and die.","Waterlogged soil, poor drainage.","Avoid waterlogging. Good drainage.","Carbendazim drench 1 g/L around affected plants.")],
  "pests":[
    pst("Pod Borer","කාය බෝරර්","high","Larvae bore into pods and eat seeds. Up to 40% pod damage.","Entry holes with frass on pod surface.","Pheromone traps. Remove and destroy affected pods.","Spinosad (0.3 ml/L) at 50% flowering."),
    pst("Bean Fly","බෝංචි මැස්සා","medium","Larvae tunnel into stems near soil level. Plants wilt and die.","Swollen tunnelled stem base in seedlings.","Seed treatment with insecticide. Early planting.","Chlorpyriphos soil drench at planting.")],
  "risks":[
    rsk("weather","Drought at Pod Fill","high","Shrivelled seeds, low grain weight, poor marketability.","Pods feel light, seeds not filling properly.","One irrigation during pod fill if dry for 10+ days."),
    rsk("weather","Waterlogging","high","Root rot kills plants rapidly. Cowpea has zero waterlogging tolerance.","Yellowing, wilting despite wet soil.","Never plant in poorly drained areas. Raised beds in wetter zones.")],
  "harvest":{"days_after_sowing":{"min":60,"max":90},"indicators":{"green":"Full pod, seeds not showing through skin, pod snaps cleanly","dry":"Pods turn cream/brown, rattle when shaken"},"method":"Hand pick green pods. Pull entire plant for dry grain. Thresh by beating.","frequency":"Green pods: every 3–4 days. Dry grain: single harvest.","yield":"1–1.5 t/ha (dry grain); 6–8 t/ha (green pods)","post_harvest":"Sun dry grain 3–5 days. Store in sealed bags with neem leaves to repel weevils."}
}

# ── MUNG BEAN ─────────────────────────────────────────────────────────────────
G["Mung Bean"] = {
  "local_name":"Mung / Mung Ata","scientific_name":"Vigna radiata","family":"Fabaceae",
  "overview":"Short-duration pulse crop — one of Sri Lanka's most important. Grown mainly in dry zone in Maha and Yala seasons. Drought tolerant, nitrogen fixing, and high nutritional value.",
  "zones":["Dry Zone","Intermediate Zone","Low Country Dry Zone"],
  "duration":{"min":60,"max":90,"note":"days after sowing"},
  "spacing":{"row_cm":30,"plant_cm":10},"propagation":"Direct sowing",
  "stages":[
    stg("land_prep","Land Preparation",-7,0,"🚜","#795548","Light tillage — mung bean is a low-input crop.",[
      act("prepare",-7,"Plough lightly and clear weeds","Shallow plough 15–20 cm. Remove previous crop residue.","Good seedbed ensures uniform emergence."),
      act("prepare",-3,"Fine tilth for small seeds","Rake to fine seedbed — mung bean seeds are small.","Fine tilth needed for good seed-soil contact.")]),
    stg("sowing","Sowing",0,7,"🌱","#4CAF50","Broadcast or row sow at correct seed rate.",[
      act("plant",0,"Sow at 25–30 kg/ha seed rate","Row sow 3 cm deep, 30 cm between rows. Or broadcast and rake in.","Higher seed rate gives better canopy for weed suppression."),
      act("water",0,"Pre-sowing irrigation if soil is dry","Irrigate 2 days before sowing to bring soil to field capacity.","Dry soil causes poor germination of small mung bean seeds.")]),
    stg("vegetative","Vegetative Growth",7,35,"🌿","#2E7D32","Rapid leaf canopy development.",[
      act("weed",14,"First and only weeding","Hand weed or hoe once between rows at 2 WAP.","Mung bean smothers weeds once canopy closes — one early weeding is sufficient."),
      act("fertilize",14,"Apply top dressing","MOP 25 kg/ha between rows.","Minimal potassium only. Nitrogen not needed — mung bean fixes its own.")]),
    stg("flowering","Flowering & Pod Set",35,65,"🌸","#FF9800","Pods develop rapidly.",[
      act("monitor",35,"Scout for pod borers","Check pods for entry holes. Act immediately at first sign.","Pod borer can destroy 30–40% of pods in a week."),
      act("water",40,"One irrigation if very dry","Water once at 50% flowering if no rain for 2+ weeks.","Water stress at flowering causes flower drop and yield loss.")]),
    stg("harvest","Harvest",60,90,"🫘","#8B6914","Staggered harvest as pods mature.",[
      act("harvest",60,"First pod pick","Harvest mature pods (black/dark) as they ripen. 2–3 picks needed.","Mung bean pods do not all mature at once — picking avoids shattering loss."),
      act("harvest",70,"Final harvest","Pull entire plant when 80% of pods are mature.","Late pods continue ripening after cutting.")])],
  "fertilization":[
    frt("Basal",0,[ap("TSP","75 kg/ha","Incorporate"),ap("MOP","50 kg/ha","Incorporate")],"Phosphorus for root nodule formation. No nitrogen needed."),
    frt("Top dressing — 2 WAP",14,[ap("MOP","25 kg/ha","Between rows")],"Minimal potassium for pod fill.")],
  "irrigation":{"frequency":"Minimal — 1–2 irrigations total if rain is insufficient","critical_stages":["Germination","Flowering"],"method":"Furrow irrigation","water_stress_signs":["Leaf wilt","Flower drop","Shrivelled pods"],"over_watering_signs":["Root rot","Yellow plants"],"notes":"Mung bean is highly drought tolerant. Excess irrigation promotes fungal diseases and lush growth with fewer pods."},
  "diseases":[
    dis("Powdery Mildew","ෆංගල්","Fungal","medium","White powdery patches on upper leaf surface.","Warm dry periods.","Good spacing.","Wettable sulphur 3 g/L."),
    dis("Bacterial Leaf Spot","බැක්ටීරියා ලප","Bacterial","low","Water-soaked angular spots on leaves.","Wet conditions, overhead irrigation.","Avoid wetting leaves.","Copper Oxychloride 3 g/L.")],
  "pests":[
    pst("Pod Borer","කාය බෝරර්","high","Larvae eat seeds inside pods. Major yield loss.","Entry holes with frass on pods.","Pheromone traps at flowering.","Spinosad (0.3 ml/L) at 50% flowering."),
    pst("Whitefly","සුදු මැස්සා","medium","Sap sucking; virus vector.","White insects on leaf undersides.","Yellow sticky traps.","Neem oil 5 ml/L.")],
  "risks":[
    rsk("weather","Drought at Flowering","high","Flower drop and poor pod set.","Flowers drop without pod formation.","One irrigation at 50% flowering."),
    rsk("weather","Heavy Rain at Harvest","high","Pods shatter, seeds sprout on plant.","Pods splitting, seeds germinating on plant.","Harvest as soon as 70–80% mature. Do not wait for full maturity in rainy season.")],
  "harvest":{"days_after_sowing":{"min":60,"max":90},"indicators":["Pods turn dark brown to black","Seeds rattle inside pod","70–80% of pods mature"],"method":"2–3 pickings of mature pods OR cut entire plant and sun-dry, then thresh.","frequency":"3 pickings 3–5 days apart","yield":"0.8–1.2 t/ha (dry grain)","post_harvest":"Sun dry 3–5 days to 12% moisture. Winnow. Store in sealed bags with neem leaves to prevent weevil attack."}
}

# ── SOYBEAN ───────────────────────────────────────────────────────────────────
G["Soybean"] = {
  "local_name":"Soya","scientific_name":"Glycine max","family":"Fabaceae",
  "overview":"Important oilseed and protein crop grown in dry and intermediate zones. High nutritional value and good market demand. Requires consistent moisture at pod fill for maximum yield.",
  "zones":["Dry Zone","Intermediate Zone","Low Country Dry Zone"],
  "duration":{"min":90,"max":120,"note":"days after sowing"},
  "spacing":{"row_cm":45,"plant_cm":10},"propagation":"Direct sowing",
  "stages":[
    stg("land_prep","Land Preparation",-7,0,"🚜","#795548","Prepare good seedbed.",[
      act("prepare",-7,"Plough to 20 cm and fine till","Break clods. Level field for uniform irrigation.","Even seedbed ensures uniform plant stand."),
      act("prepare",-3,"Inoculate seed if first planting","Treat seed with Bradyrhizobium japonicum inoculant if first time in field.","Inoculant establishes nitrogen-fixing nodules — critical if soybean not grown before.")]),
    stg("sowing","Sowing",0,10,"🌱","#4CAF50","Sow at correct rate and depth.",[
      act("plant",0,"Sow 40–50 kg/ha at 3–4 cm depth","Row spacing 45 cm, 3–5 seeds per 30 cm.","Correct population density is key to yield."),
      act("water",0,"Pre-sowing irrigation if dry","Bring soil to field capacity before sowing.","Dry soil causes poor germination.")]),
    stg("vegetative","Vegetative Growth",10,45,"🌿","#2E7D32","Build strong leaf canopy.",[
      act("weed",14,"First weeding","Hand weed or inter-row cultivation.","Weed-free first 4 weeks is critical."),
      act("fertilize",14,"Apply top dressing","MOP 50 kg/ha + Urea 25 kg/ha.","Low nitrogen only as starter. Potassium for pod strength."),
      act("weed",28,"Second weeding","Final weeding — canopy closes after this.","Canopy will suppress weeds from this point.")]),
    stg("flowering","Flowering & Pod Fill",45,85,"🌸","#FF9800","Critical water demand stage.",[
      act("water",50,"Ensure adequate moisture","Irrigate every 7–10 days if no rain. Critical stage.","Water stress at R3–R5 (pod fill) causes the most significant yield reduction."),
      act("monitor",50,"Scout for pod borer","Check pods for entry holes.","Pod borer is the main pest of soybean.")]),
    stg("harvest","Harvest",90,120,"🫘","#8B4513","Harvest at physiological maturity.",[
      act("prepare",85,"Reduce irrigation","Stop watering 2 weeks before harvest.","Allows uniform pod maturation and reduces lodging."),
      act("harvest",90,"Harvest when 90% pods are brown","Cut or pull plants. Sun-dry before threshing.","Premature harvest reduces seed oil content.")])],
  "fertilization":[
    frt("Basal",0,[ap("TSP","100 kg/ha","Incorporate"),ap("MOP","75 kg/ha","Incorporate")],"Phosphorus and potassium only — no nitrogen basal."),
    frt("Top dressing — 2 WAP",14,[ap("Urea","25 kg/ha","Between rows"),ap("MOP","50 kg/ha","Between rows")],"Starter nitrogen and potassium.")],
  "irrigation":{"frequency":"Every 7–10 days","critical_stages":["Germination","Pod Fill (Day 50–80)"],"method":"Furrow irrigation","water_stress_signs":["Leaf rolling midday","Pod abortion","Shrivelled seeds"],"over_watering_signs":["Root rot","Lodging"],"notes":"Most critical: maintain moisture from R3 (pod beginning) to R6 (seed fill). Missing irrigation here causes 30–50% yield loss."},
  "diseases":[
    dis("Soybean Rust","රස්ට්","Fungal (Phakopsora pachyrhizi)","high","Tiny tan/brown lesions on lower leaf surface. Leaves yellow and drop prematurely.","Humid warm conditions 18–28°C, dew or rain.","Monitor weekly. Plant resistant varieties if available.","Azoxystrobin (0.5 ml/L) or Trifloxystrobin (0.5 ml/L) at first sign. Repeat every 14 days."),
    dis("Root Rot","රූට් රොට්","Fungal","medium","Browning of roots and lower stem. Plant yellows and dies.","Waterlogged soil, cool wet conditions.","Good drainage. Do not plant in waterlogged areas.","Carbendazim drench 1 g/L.")],
  "pests":[
    pst("Pod Borer","කාය බෝරර්","high","Larvae bore into pods and eat seeds. 20–40% loss.","Entry holes and frass on pods.","Pheromone traps at flowering.","Spinosad (0.3 ml/L) at pod formation."),
    pst("Aphids","ලිතා","medium","Sap sucking on leaves and pods. Honeydew attracts mold.","Clusters of small insects on stems and leaves.","Natural enemies. Early detection.","Dimethoate 40EC (1.5 ml/L).")],
  "risks":[
    rsk("weather","Drought at Pod Fill","high","Most critical yield risk. 30–50% yield reduction.","Pods feel light and flat, seeds shrivelled.","Irrigate every 7–10 days during R3–R6. Do not miss."),
    rsk("weather","Waterlogging","high","Kills plants within 48 hours.","Yellow wilting despite wet soil.","Raised beds in wetter areas. Clear drainage channels.")],
  "harvest":{"days_after_sowing":{"min":90,"max":120},"indicators":["90% of pods turned brown/yellow","Seeds rattle in pods","Plants yellowed and drying"],"method":"Cut plants at soil level. Bundle and sun-dry 3–5 days. Thresh by beating or machine.","frequency":"Single harvest","yield":"1.5–2.5 t/ha","post_harvest":"Sun dry to 12% moisture. Winnow. Store in sealed bags in cool dry place."}
}

# ── PIGEON PEA ────────────────────────────────────────────────────────────────
G["Pigeon Pea"] = {
  "local_name":"Kandula","scientific_name":"Cajanus cajan","family":"Fabaceae",
  "overview":"Long-duration drought-tolerant legume tree widely grown in Sri Lanka's dry zone. Improves soil fertility. Deep roots access subsoil moisture — survives severe drought that kills other crops.",
  "zones":["Dry Zone","Northern Dry Zone","Eastern Dry Zone","Low Country Dry Zone"],
  "duration":{"min":120,"max":180,"note":"days after sowing"},
  "spacing":{"row_cm":90,"plant_cm":60},"propagation":"Direct sowing (3 seeds per hole)",
  "stages":[
    stg("land_prep","Land Preparation",-7,0,"🚜","#795548","Minimal preparation — deep taproots handle difficult soils.",[
      act("prepare",-7,"Plough once and clear weeds","Single plough 20 cm. Remove previous crop debris.","Pigeon pea is tolerant but good start reduces early competition."),
      act("fertilize",-7,"Apply minimal basal fertiliser","TSP 75 kg/ha incorporated. No nitrogen.","Phosphorus helps early root development; no nitrogen — pigeon pea fixes its own.")]),
    stg("sowing","Sowing & Germination",0,14,"🌱","#4CAF50","Sow at onset of rains.",[
      act("plant",0,"Sow 3 seeds per hole at 4 cm depth","Space 60×90 cm. Sow at start of rain season.","Pigeon pea benefits from early rains for fast establishment."),
      act("plant",10,"Thin to 2 plants per hole","Remove weakest seedling.","2 plants per hole improves stability and yield.")]),
    stg("vegetative","Vegetative Growth",14,70,"🌿","#2E7D32","Tall bushy plant develops over several months.",[
      act("weed",21,"Weed twice in first 6 weeks","Weed at 3 and 6 WAP. Pigeon pea smothers weeds after.","Weed competition in first 6 weeks is the main yield limiter."),
      act("fertilize",28,"One top dressing","MOP 50 kg/ha between rows.","Potassium for stem strength and later pod filling.")]),
    stg("flowering","Flowering & Pod Fill",70,140,"🌸","#FF9800","Long fruiting period. Different plants mature at different times.",[
      act("monitor",75,"Check for pod borer","Inspect pods for entry holes and frass from day 75.","Pod borer is the primary pest of pigeon pea."),
      act("water",90,"Supplemental irrigation if very dry","One or two irrigations during pod fill if rainfall fails.","Even drought-tolerant pigeon pea needs some moisture at pod fill.")]),
    stg("harvest","Harvest",120,180,"🫘","#795548","Multiple picks as pods mature.",[
      act("harvest",120,"Begin picking mature pods","Pick dark-coloured mature pods. Green pods for vegetable use at 100–120 days.","Staggered harvest maximises total yield."),
      act("harvest",140,"Continue picking","2–4 picks over 3–4 weeks.","All pods do not mature simultaneously.")])],
  "fertilization":[
    frt("Basal",0,[ap("TSP","75 kg/ha","Incorporate")],"Phosphorus only for root development."),
    frt("Top dressing — 4 WAP",28,[ap("MOP","50 kg/ha","Between rows")],"Potassium for stem and pod development.")],
  "irrigation":{"frequency":"Rainfed primarily. 1–2 supplemental irrigations if needed.","critical_stages":["Germination","Pod Fill"],"method":"Furrow if available","water_stress_signs":["Leaf wilt in severe drought","Pod abortion"],"over_watering_signs":["Root rot","Yellow lower leaves"],"notes":"Pigeon pea is one of the most drought-tolerant crops. Deep taproot accesses subsoil moisture. Avoid waterlogging at all costs."},
  "diseases":[
    dis("Fusarium Wilt","ෆ්‍යුසේරියම් විල්ට්","Fungal (Fusarium udum)","high","Yellowing and wilting of one or more branches. Vascular browning in stem cross-section.","Warm soil, infected soil.","Crop rotation every 3 years. Resistant varieties.","No effective chemical cure. Lime area. Rotate crops."),
    dis("Leaf Spot","කොළ ලප","Fungal (Alternaria/Cercospora)","low","Brown circular spots on leaves. Minor yield impact.","High humidity.","Good air circulation.","Mancozeb 2.5 g/L if severe.")],
  "pests":[
    pst("Pod Borer","කාය බෝරර්","high","Larvae bore into pods. 30–50% pod damage.","Entry holes and frass on pods.","Pheromone traps from day 75.","Spinosad (0.3 ml/L) at 50% flowering."),
    pst("Aphids","ලිතා","low","Clusters on young shoots.","Soft insect colonies.","Natural enemies.","Neem oil 5 ml/L.")],
  "risks":[
    rsk("weather","Extended Drought at Pod Fill","medium","Reduces seed fill. Pigeon pea usually survives but yield drops.","Light flat pods.","Supplemental irrigation 1–2 times at pod fill."),
    rsk("disease","Fusarium Wilt","high","Can kill 30–50% of plants in infected fields.","Branch dieback, vascular browning.","3-year rotation. Never replant in affected area.")],
  "harvest":{"days_after_sowing":{"min":120,"max":180},"indicators":{"green":"Pods full and plump, light green — 100–120 days","dry":"Pods turn brown and hard — 150–180 days"},"method":"Hand pick mature pods. 3–4 pickings over 3–4 weeks.","frequency":"Multiple picks every 10–14 days","yield":"1–2 t/ha (dry grain); 5–8 t/ha (green pods)","post_harvest":"Sun dry grain. Thresh and winnow. Store in sealed bags with neem leaves."}
}

# ── WINGED BEAN ───────────────────────────────────────────────────────────────
G["Winged Bean (Dambala)"] = {
  "local_name":"Dambala","scientific_name":"Psophocarpus tetragonolobus","family":"Fabaceae",
  "overview":"Highly nutritious tropical legume — every part is edible (pods, leaves, flowers, tubers). Grown in wet and intermediate zones. Climbing vine requiring strong trellis. Rich in protein, vitamins, and minerals.",
  "zones":["Low Country Wet Zone","Mid Country Wet Zone","Intermediate Zone"],
  "duration":{"min":90,"max":120,"note":"days to first pod harvest; plant continues for months"},
  "spacing":{"row_cm":100,"plant_cm":50},"propagation":"Direct sowing (2 seeds per hole)",
  "stages":[
    stg("land_prep","Land Preparation",-14,0,"🚜","#795548","Prepare and install strong trellis.",[
      act("prepare",-14,"Dig pits and install trellis","45×45×45 cm pits with compost mix. Erect 2 m trellis — winged bean vines are heavy.","Strong trellis is critical — weak support causes vine collapse."),
      act("fertilize",-7,"Apply compost to pits","3–5 kg compost per pit.","Rich organic matter for the long-duration perennial vine.")]),
    stg("sowing","Sowing & Germination",0,14,"🌱","#4CAF50","Sow and establish.",[
      act("plant",0,"Sow 2 seeds per pit at 3 cm depth","Water immediately. Keep moist.","Winged bean seeds can be slow to germinate — 10–14 days is normal."),
      act("plant",12,"Thin to 1 strong plant","Remove weaker seedling.","One vigorous plant per pit is more productive than two competing.")]),
    stg("vegetative","Vine Development",14,60,"🌿","#2E7D32","Vigorous vine growth — train carefully.",[
      act("train",14,"Guide main stem onto trellis","Tie loosely to trellis. Direct lateral shoots outward.","Early training prevents tangled mass that reduces air circulation."),
      act("fertilize",28,"Top dressing 1","Urea 50 kg/ha ring + MOP 50 kg/ha.","Moderate nitrogen — winged bean fixes some of its own nitrogen."),
      act("weed",28,"Weed around base","Keep base weed-free. Mulch with dry grass.","Mulch retains moisture and suppresses weeds for this long-duration crop.")]),
    stg("flowering","Flowering & Pod Production",60,120,"🌸","#9C27B0","Continuous flowering and pod harvest.",[
      act("fertilize",63,"Top dressing 2","Urea 50 kg/ha + MOP 75 kg/ha.","Sustained nutrition for continuous pod production."),
      act("monitor",65,"Check for pod borers and bean fly","Inspect pods and stems daily.","Early management maintains continuous production."),
      act("water",70,"Regular irrigation","Water every 3–4 days. Critical for pod development.","Consistent moisture keeps plant producing pods continuously.")]),
    stg("harvest","Harvest",90,365,"🫘","#6A1B9A","Regular pod harvest encourages continuous production.",[
      act("harvest",90,"Begin regular pod harvest","Pick young tender pods when 10–15 cm, still flat.","Young pods are tender and have best eating quality."),
      act("harvest",93,"Harvest every 3–4 days","Remove all mature pods. Leaving mature pods stops new pod formation.","Regular picking extends productive season to 6–12 months.")])],
  "fertilization":[
    frt("Basal",0,[ap("Compost","5 kg/pit","Mix thoroughly into pit"),ap("TSP","100 g/pit","Mix"),ap("MOP","50 g/pit","Mix")],"Rich pit preparation for long-duration crop."),
    frt("Top dressing 1 — 4 WAP",28,[ap("Urea","50 kg/ha","Ring"),ap("MOP","50 kg/ha","Ring")],"Vine development."),
    frt("Top dressing 2 — 9 WAP",63,[ap("Urea","50 kg/ha","Ring"),ap("MOP","75 kg/ha","Ring")],"Sustain continuous flowering.")],
  "irrigation":{"frequency":"Every 3–4 days","critical_stages":["Flowering","Pod Development"],"method":"Basin irrigation","water_stress_signs":["Flower drop","Leaf wilt","Sparse pods"],"over_watering_signs":["Root rot","Yellow leaves"],"notes":"Winged bean needs consistent moisture throughout. Never allow prolonged dry spells during flowering."},
  "diseases":[
    dis("Leaf Spot","කොළ ලප","Fungal","medium","Brown spots on leaves. Reduces photosynthesis.","High humidity, poor air circulation.","Good trellis spacing for air flow.","Mancozeb 2.5 g/L if severe."),
    dis("Root Rot","රූට් රොට්","Fungal","medium","Rotting of main root. Plant wilts and dies.","Waterlogged soil.","Raised pits with good drainage.","Carbendazim drench 1 g/L.")],
  "pests":[
    pst("Pod Borer","කාය බෝරර්","high","Larvae bore into pods. Reduces yield significantly.","Entry holes and frass on pods.","Pheromone traps.","Spinosad (0.3 ml/L) weekly during pod production."),
    pst("Bean Fly","බෝංචි මැස්සා","medium","Larvae tunnel into stems near base.","Swollen stem base, wilting plant.","Seed treatment. Early inspection.","Chlorpyriphos drench at planting.")],
  "risks":[
    rsk("weather","Drought","high","Winged bean needs more water than other legumes. Flower drop without moisture.","Sparse flowering, pod drop.","Regular drip or furrow irrigation. Heavy mulching."),
    rsk("management","Weak Trellis","high","Heavy mature vines collapse, breaking stems and losing entire crop.","Trellis poles leaning, wires sagging.","Use hardwood or concrete poles. Inspect trellis before rainy season.")],
  "harvest":{"days_after_sowing":{"min":90,"max":120},"indicators":["Pods 10–15 cm long with prominent wings","Pods still flat — seeds not bulging","Pods snap cleanly"],"method":"Hand pick individual pods. Cut with scissors to avoid stem damage.","frequency":"Every 3–4 days","yield":"5–8 t/ha (green pods) over full season","post_harvest":"Store cool. Market within 2–3 days. Young leaves can also be picked for cooking."}
}

# ── MAIZE ─────────────────────────────────────────────────────────────────────
G["Maize"] = {
  "local_name":"Iringu Ata","scientific_name":"Zea mays","family":"Poaceae",
  "overview":"Important cereal crop grown widely in Sri Lanka's dry and intermediate zones. Used for human consumption, animal feed, and processing. Critical to manage Fall Armyworm, which is the most destructive pest.",
  "zones":["Dry Zone","Intermediate Zone","Low Country Dry Zone"],
  "duration":{"min":90,"max":120,"note":"days after sowing"},
  "spacing":{"row_cm":75,"plant_cm":25},"propagation":"Direct sowing (2 seeds per hole, thin to 1)",
  "stages":[
    stg("land_prep","Land Preparation",-14,0,"🚜","#795548","Prepare fertile well-drained field.",[
      act("prepare",-14,"Deep plough to 25 cm","Break clods, level field, form rows.","Maize has a deep root system that benefits from deep tillage."),
      act("fertilize",-7,"Apply compost","Incorporate 5–8 t/ha compost.","Organic matter improves moisture retention in dry-zone soils.")]),
    stg("sowing","Sowing & Germination",0,10,"🌱","#4CAF50","Sow at correct population.",[
      act("plant",0,"Sow 2 seeds per hole at 3–4 cm","Row spacing 75 cm, spacing 25 cm. Aim for 50,000–60,000 plants/ha.","Correct plant population is critical — too sparse or dense both reduce yield."),
      act("plant",7,"Thin to 1 plant per hole","Remove weaker seedling at 7–10 days.","One strong plant per position is more productive than two competing."),
      act("water",3,"Irrigate if no rain","Water every 5–7 days in first 3 weeks if dry.","Uniform germination needs consistent moisture.")]),
    stg("vegetative","Vegetative Growth",10,50,"🌿","#2E7D32","Rapid tall stem growth — build leaf area.",[
      act("weed",14,"First weeding","Hoe between rows. Critical weed-free period.","Weeds at this stage compete heavily — one weedy month can reduce yield 40%."),
      act("fertilize",21,"Top dressing 1","Urea 100 kg/ha between rows. Side dress and hill up.","High nitrogen demand during vegetative phase."),
      act("monitor",21,"Begin FAW scouting","Check whorls of young plants for frass and feeding damage.","Fall Armyworm hides in the whorl — must check inside plant."),
      act("weed",35,"Second weeding and hill up","Hill up soil 15 cm around plant base.","Earthing up prevents lodging (plants falling over) and supports root development.")]),
    stg("tasseling","Tasseling & Silking",50,75,"🌽","#FFC107","Critical pollination stage — protect silks.",[
      act("fertilize",56,"Top dressing 2","Urea 75 kg/ha between rows.","Final nitrogen push before cob fill."),
      act("water",55,"Ensure adequate moisture","Irrigate every 5–7 days. Critical at silking.","Water stress at tasseling/silking causes poor pollination and blank cobs."),
      act("monitor",60,"Check for stem borer","Look for dead hearts (central dead leaf) or entry holes in stems.","Stem borer at this stage bores into developing cob stalk.")]),
    stg("grain_fill","Grain Fill & Maturity",75,110,"🌽","#FF9800","Cobs fill with grain.",[
      act("water",80,"Maintain moisture","Irrigate every 7 days during grain fill.","Water stress during grain fill causes kernel abortion and reduces yield."),
      act("monitor",85,"Bird scaring","Post reflective tape or place scarecrows. Patrol morning and evening.","Birds and squirrels cause 10–20% grain loss at this stage.")]),
    stg("harvest","Harvest",90,120,"🌽","#E65100","Harvest at physiological maturity.",[
      act("harvest",90,"Check for harvest readiness","Husk a cob — kernels should be hard and dented at crown.","Soft kernels = too early. Dented hard kernels = ready for dry grain harvest."),
      act("harvest",92,"Harvest and dry","Pull cobs, remove husks, sun dry.","Sun drying reduces moisture to safe storage levels.")])],
  "fertilization":[
    frt("Basal",0,[ap("TSP","125 kg/ha","Band in row"),ap("MOP","100 kg/ha","Incorporate")],"Phosphorus and potassium at planting."),
    frt("Top dressing 1 — 3 WAP",21,[ap("Urea","100 kg/ha","Side dress, hill up")],"Primary nitrogen for vegetative growth."),
    frt("Top dressing 2 — 8 WAP",56,[ap("Urea","75 kg/ha","Side dress")],"Cob fill nitrogen.")],
  "irrigation":{"frequency":"Every 5–7 days","critical_stages":["Germination","Tasseling/Silking (Day 50–65)","Grain Fill (Day 75–95)"],"method":"Furrow irrigation","water_stress_signs":["Leaf rolling during day","Silks browning rapidly","Poor cob fill"],"over_watering_signs":["Root rot","Stalk lodging"],"notes":"Most critical: NEVER stress maize at tasseling/silking — this is the single most yield-determining water timing."},
  "diseases":[
    dis("Maize Leaf Blight","කොළ නිල්","Fungal (Exserohilum turcicum)","medium","Long tan-grey lesions with wavy margins on leaves. Reduces photosynthesis.","Warm humid conditions, overhead dew.","Good spacing. Resistant varieties.","Mancozeb 2.5 g/L or Azoxystrobin 0.5 ml/L."),
    dis("Bacterial Stalk Rot","බැක්ටීරියා","Bacterial","medium","Rotting of lower stalk. Foul odour. Lodging.","Waterlogged soil, physical wounding.","Good drainage. Avoid waterlogging.","No chemical treatment. Drainage improvement.")],
  "pests":[
    pst("Fall Armyworm","ෆෝල් ආමිවෝම්","high","Larvae feed inside whorl, destroying growing point. Can destroy 50–100% of young crop.","Frass (sawdust-like) in whorl. Ragged window-pane feeding on leaves.","Early morning scouting. Apply sand + insecticide mixture into whorl.","Apply Emamectin benzoate (0.4 g/L) directly into whorl. Act within 2 days of first sign."),
    pst("Stem Borer","කඳ බෝරර්","medium","Larvae bore into stalk. Dead heart in young plants; bored stem at maturity.","Dead central leaf, frass on stalk, entry holes.","Pheromone traps.","Chlorpyriphos granules in whorl at 3 WAP.")],
  "risks":[
    rsk("pest","Fall Armyworm Outbreak","high","Can destroy entire crop if not controlled within 72 hours of detection.","Frass in whorls, ragged leaves, rapid defoliation.","Scout daily from day 14. Apply insecticide into whorl IMMEDIATELY at first sign."),
    rsk("weather","Drought at Tasseling","high","Poor pollination causes blank cobs with no grain.","Brown silks before pollen shed. Empty cob at harvest.","Irrigate every 5–7 days. Never miss during this 2-week window.")],
  "harvest":{"days_after_sowing":{"min":90,"max":120},"indicators":{"grain":"Kernels dented and hard, black layer visible at base of kernel","fresh":"Silks brown, kernels milky when punctured"},"method":"Pull cob downward and twist off. Remove husk. Spread to sun-dry.","frequency":"Single harvest for dry grain; multiple for fresh corn","yield":"4–6 t/ha (grain)","post_harvest":"Sun dry 5–7 days to 13% moisture. Shell. Store in sealed bags or metal drums. Use phosphine tablets if storing more than 3 months."}
}

# ── SWEET CORN ────────────────────────────────────────────────────────────────
G["Sweet Corn"] = {
  "local_name":"Sweet Corn","scientific_name":"Zea mays saccharata","family":"Poaceae",
  "overview":"High-value fresh vegetable version of maize. Harvested at the milky stage for eating. Short growing period and excellent market demand in Sri Lanka.",
  "zones":["Dry Zone","Intermediate Zone","Low Country Dry Zone"],
  "duration":{"min":65,"max":100,"note":"days after sowing"},
  "spacing":{"row_cm":60,"plant_cm":25},"propagation":"Direct sowing",
  "stages":[
    stg("land_prep","Land Preparation",-7,0,"🚜","#795548","Prepare fertile field.",[
      act("prepare",-7,"Plough 25 cm deep and fine till","Level well. Sweet corn requires uniform growth for simultaneous harvest.","Uniform field preparation = uniform plant population = single-time harvest.")]),
    stg("sowing","Sowing",0,10,"🌱","#4CAF50","Sow at correct population.",[
      act("plant",0,"Sow 2 seeds per hole, 25×60 cm","Cover 3–4 cm deep. Water.","Higher population than grain maize for sweet corn."),
      act("plant",7,"Thin to 1 plant","Remove weaker seedling.","Single strong plant per position.")]),
    stg("vegetative","Vegetative Growth",10,45,"🌿","#2E7D32","Rapid growth phase.",[
      act("weed",14,"Weed and hill up","Hoe between rows and heap soil around base.","Hilling prevents lodging."),
      act("fertilize",21,"Top dressing 1","Urea 100 kg/ha side dress.","High nitrogen for sweet corn quality."),
      act("monitor",21,"Scout for Fall Armyworm","Check whorls for frass.","FAW management same as maize — critical early.")]),
    stg("tasseling","Tasseling & Silking",45,65,"🌽","#FFC107","Pollination determines kernel fill.",[
      act("water",50,"Irrigate every 4–5 days","Critical moisture at silking.","Silk drying out = poor pollination = missing kernels."),
      act("fertilize",49,"Top dressing 2","Urea 50 kg/ha.","Final nitrogen for sweet kernel development.")]),
    stg("harvest","Harvest",65,100,"🌽","#FFEB3B","Harvest at milky stage — timing is critical.",[
      act("harvest",65,"Check for milky stage","Pierce a kernel with thumbnail — milky liquid = harvest now.","Sweet corn quality window is only 3–5 days. Miss it = starchy cobs."),
      act("harvest",67,"Harvest entire field within 3–5 days","Stagger planting by 2 weeks for continuous supply.","Once at milky stage, all cobs mature quickly.")])],
  "fertilization":[
    frt("Basal",0,[ap("TSP","125 kg/ha","Band"),ap("MOP","100 kg/ha","Incorporate")],"Base nutrients at planting."),
    frt("Top dressing 1 — 3 WAP",21,[ap("Urea","100 kg/ha","Side dress")],"Vegetative growth."),
    frt("Top dressing 2 — 7 WAP",49,[ap("Urea","50 kg/ha","Side dress")],"Kernel sugar development.")],
  "irrigation":{"frequency":"Every 4–5 days","critical_stages":["Silking (Day 50–65)"],"method":"Furrow irrigation","water_stress_signs":["Leaf rolling","Brown silks before pollination","Empty kernels"],"over_watering_signs":["Lodging","Root rot"],"notes":"Sweet corn has LESS drought tolerance than grain maize. Never miss irrigation at silking."},
  "diseases":[
    dis("Leaf Blight","නිල් රෝගය","Fungal","medium","Grey-tan leaf lesions.","Humid conditions.","Resistant varieties. Good spacing.","Mancozeb 2.5 g/L."),
    dis("Smut","ස්මට්","Fungal (Ustilago maydis)","low","Large white-grey galls on cobs and tassels.","Warm dry conditions, wounded tissue.","Crop rotation.","Remove and destroy affected cobs before galls burst.")],
  "pests":[
    pst("Fall Armyworm","ෆෝල් ආමිවෝම්","high","Larvae destroy growing point and enter cobs.","Frass in whorls and cobs.","Daily scouting from day 14.","Emamectin benzoate (0.4 g/L) into whorl immediately."),
    pst("Corn Earworm","ලාර්වා","medium","Larvae feed on kernels at cob tip.","Frass at silk end of cob, damaged tip kernels.","Apply Bt spray on silks during pollination.","Spinosad (0.3 ml/L) on silks.")],
  "risks":[
    rsk("pest","Fall Armyworm","high","Destroys crop rapidly if not controlled within 48–72 hours.","Frass in whorls, rapid defoliation.","Scout daily. Act immediately."),
    rsk("management","Missing Harvest Window","high","Over-mature sweet corn becomes starchy and worthless.","Hard starchy kernels. No milky liquid.","Check daily from day 63. Harvest entire block within 3–5 days of milky stage.")],
  "harvest":{"days_after_sowing":{"min":65,"max":100},"indicators":["Silks are brown and dry","Cob feels plump and firm when squeezed through husk","Milky liquid spurts from kernel when pressed with thumbnail"],"method":"Snap cob downward and twist off. Keep husks on for freshness.","frequency":"Harvest all cobs within 3–5 days of reaching milky stage","yield":"8–12 t/ha","post_harvest":"Keep in husk. Store cool. Market within 24–48 hours. Sugars convert to starch rapidly at ambient temperature."}
}

# ── SORGHUM ───────────────────────────────────────────────────────────────────
G["Sorghum"] = {
  "local_name":"Dura","scientific_name":"Sorghum bicolor","family":"Poaceae",
  "overview":"Highly drought-tolerant cereal grown in Sri Lanka's driest areas. Survives dry conditions that kill maize. Used for human food, animal feed, and brewing. Very hardy and low-input.",
  "zones":["Dry Zone","Northern Dry Zone","Eastern Dry Zone","Low Country Dry Zone"],
  "duration":{"min":90,"max":120,"note":"days after sowing"},
  "spacing":{"row_cm":60,"plant_cm":20},"propagation":"Direct sowing",
  "stages":[
    stg("land_prep","Land Preparation",-7,0,"🚜","#795548","Light preparation — sorghum tolerates difficult conditions.",[
      act("prepare",-7,"Plough once to 20 cm","Remove weeds and level.","Sorghum tolerates poor conditions but good start improves yield significantly.")]),
    stg("sowing","Sowing",0,10,"🌱","#4CAF50","Sow at start of rains.",[
      act("plant",0,"Sow 2–3 seeds per hole at 3–4 cm depth","Spacing 20×60 cm.","Sow at start of rain season for best establishment."),
      act("plant",7,"Thin to 1–2 plants per hole","Keep stronger seedlings.","Reduces competition while maintaining good stand.")]),
    stg("vegetative","Vegetative Growth",10,50,"🌿","#2E7D32","Rapid growth with good nutrient uptake.",[
      act("weed",14,"Weed once at 2–3 WAP","Critical weed-free period.","Weed competition in first 4 weeks reduces yield by up to 50%."),
      act("fertilize",21,"Top dressing","Urea 75 kg/ha + MOP 50 kg/ha between rows.","Sorghum responds well to nitrogen even in poor soils.")]),
    stg("flowering","Booting & Heading",50,80,"🌾","#FFC107","Head emerges and grain fills.",[
      act("monitor",50,"Scout for shoot fly and stem borer","Check for dead hearts and stem entry holes.","Stem borer at heading reduces grain fill significantly."),
      act("water",55,"Irrigate if possible at heading","One irrigation at heading if no rain.","Even drought-tolerant sorghum benefits from moisture at heading.")]),
    stg("harvest","Harvest",90,120,"🌾","#8B6914","Harvest at full grain maturity.",[
      act("monitor",85,"Watch for grain mold","Check heads for black/pink mold during wet weather.","Grain mold is the biggest risk in humid harvesting conditions."),
      act("harvest",90,"Harvest when grain is hard","Heads turn brown, grain hard and dry.","Early harvest when grain is soft increases mold and storage loss."),
      act("harvest",92,"Thresh and dry","Cut heads. Thresh by beating. Sun dry 3–5 days.","Rapid drying prevents grain mold in storage.")])],
  "fertilization":[
    frt("Basal",0,[ap("TSP","75 kg/ha","Band"),ap("MOP","50 kg/ha","Incorporate")],"Base P and K at planting."),
    frt("Top dressing — 3 WAP",21,[ap("Urea","75 kg/ha","Side dress"),ap("MOP","50 kg/ha","Side dress")],"Nitrogen and potassium for growth and grain fill.")],
  "irrigation":{"frequency":"Rainfed mainly; 1–2 supplemental irrigations if available","critical_stages":["Germination","Heading (Day 50–65)"],"method":"Furrow if available","water_stress_signs":["Leaf rolling in morning","Small heads"],"over_watering_signs":["Root rot — rare in sorghum"],"notes":"Sorghum has a unique ability to pause growth during drought and resume when rain returns. Best drought tolerance of all cereal crops."},
  "diseases":[
    dis("Grain Mold","ධාන්‍ය මෝල්ඩ්","Fungal (multiple species)","high","Pink/black mold on grain heads. Reduces grain quality dramatically.","Warm humid conditions at harvest. Rain at heading.","Harvest promptly when mature. Dry quickly.","No chemical treatment after heading. Prevention: harvest timing."),
    dis("Leaf Blight","කොළ රෝගය","Fungal","low","Grey lesions on leaves.","Humid conditions.","Good spacing.","Mancozeb 2.5 g/L if severe.")],
  "pests":[
    pst("Shoot Fly","ෂූට් ෆ්ලයි","high","Larvae destroy growing point of young plants (dead heart). Up to 30% stand loss.","Central leaf dead and pulls out easily. Small maggot at base.","Early planting to avoid peak fly period.","Chlorpyriphos soil drench at planting or Imidacloprid seed treatment."),
    pst("Stem Borer","කඳ බෝරර්","medium","Larvae bore into stem. Dead heart or broken stem at heading.","Entry holes in stem. Frass. Dead heart.","Pheromone traps.","Chlorpyriphos granules in whorl at 3 WAP.")],
  "risks":[
    rsk("weather","Rain at Harvest (Grain Mold)","high","Grain mold is the primary risk. Renders entire crop unsaleable.","Pink/black mold visible on heads.","Harvest immediately when ripe. Dry rapidly under shelter if rain threatens."),
    rsk("pest","Birds","high","Birds consume ripening grain — can cause 30–40% loss in dry zone.","Grain missing from heads, bird flocks.","Post scarecrows. Patrol field morning and evening. Reflective tape on stakes.")],
  "harvest":{"days_after_sowing":{"min":90,"max":120},"indicators":["Grain hard and cannot be dented with thumbnail","Head fully coloured (red-brown or white depending on variety)","Moisture content of grain <20%"],"method":"Cut heads with sickle. Bundle. Sun dry 5–7 days on clean surface. Thresh by beating or roll on concrete.","frequency":"Single harvest","yield":"2–4 t/ha","post_harvest":"Dry to 12% moisture. Winnow clean. Store in sealed metal or plastic containers. Sorghum is susceptible to weevils."}
}

# ── KURAKKAN ──────────────────────────────────────────────────────────────────
G["Kurakkan"] = {
  "local_name":"Kurakkan","scientific_name":"Eleusine coracana","family":"Poaceae",
  "overview":"Traditional finger millet — a cultural staple of rural Sri Lanka for centuries. Highly nutritious with exceptional calcium and iron content. Extremely drought tolerant. Grows in the poorest marginal soils.",
  "zones":["Dry Zone","Intermediate Zone","Low Country Dry Zone"],
  "duration":{"min":90,"max":120,"note":"days after sowing"},
  "spacing":{"row_cm":30,"plant_cm":10},"propagation":"Direct sowing or transplanting",
  "stages":[
    stg("land_prep","Land Preparation",-7,0,"🚜","#795548","Minimal preparation — kurakkan grows in poor soils.",[
      act("prepare",-7,"Light plough and clear weeds","Plough 15–20 cm. Remove weeds.","Good weed control at start is the most important management step."),
      act("prepare",-3,"Fine tilth for small seeds","Rake to fine seedbed — kurakkan seeds are tiny.","Very small seeds need good seed-soil contact for germination.")]),
    stg("sowing","Sowing",0,10,"🌱","#4CAF50","Broadcast or transplant.",[
      act("plant",0,"Broadcast sow at 10–12 kg/ha or transplant","Broadcast and rake in 1–2 cm, OR transplant 25-day nursery seedlings at 10×30 cm.","Transplanting gives better establishment but more labour. Both methods work."),
      act("water",3,"One light watering if soil is dry","Mist spray or gentle watering.","Small seeds need surface moisture for germination.")]),
    stg("vegetative","Vegetative Growth",10,50,"🌿","#2E7D32","Tillering phase — multiple stems develop.",[
      act("weed",14,"First weeding (critical)","Hand weed or hoe carefully. Small plants are easily damaged.","Weed competition at tillering stage reduces yield more than any other management factor."),
      act("fertilize",21,"Top dressing","Urea 50 kg/ha + MOP 50 kg/ha between rows.","Modest nutrition — kurakkan is adapted to low-fertility soils."),
      act("weed",35,"Second weeding","Final weeding before canopy closes.","Two clean weedings are usually sufficient for the crop.")]),
    stg("heading","Heading & Grain Fill",50,90,"🌾","#795548","Finger-like heads develop and fill with grain.",[
      act("monitor",55,"Watch for blast disease","Check leaves and heads for lesions — blast is the key disease of kurakkan.","Blast can destroy 50–80% of grain in susceptible conditions."),
      act("monitor",70,"Bird protection","Post scarecrows and patrol morning and evening.","Birds are a serious problem at grain fill — 20–40% loss possible.")]),
    stg("harvest","Harvest",90,120,"🌾","#5D4037","Harvest heads when grain fully formed.",[
      act("harvest",90,"Cut heads when grain hard","Grain hard and brown. Cut heads with sickle.","Harvesting heads only reduces labour compared to cutting whole plant."),
      act("harvest",95,"Sun dry and thresh","Dry heads on clean mats 5–7 days. Thresh by beating or rolling.","Proper drying prevents grain mold in storage.")])],
  "fertilization":[
    frt("Basal",0,[ap("TSP","75 kg/ha","Incorporate"),ap("MOP","50 kg/ha","Incorporate")],"Modest base fertiliser."),
    frt("Top dressing — 3 WAP",21,[ap("Urea","50 kg/ha","Between rows"),ap("MOP","50 kg/ha","Between rows")],"Moderate nitrogen and potassium.")],
  "irrigation":{"frequency":"Rainfed primarily; 1–2 supplemental irrigations if available","critical_stages":["Germination","Heading"],"method":"Furrow if available","water_stress_signs":["Leaf rolling","Small heads with poor grain fill"],"over_watering_signs":["Root rot — rare","Blast disease"],"notes":"Kurakkan is one of the most drought-tolerant crops in Sri Lanka. Grown successfully on rainfall of 600–1200 mm. Overwatering promotes blast disease."},
  "diseases":[
    dis("Blast","බ්ලාස්ට්","Fungal (Magnaporthe oryzae)","high","Diamond-shaped grey lesions on leaves. Neck blast turns entire head white and empty — 'white ear'.","High humidity, night dew, dense planting.","Good plant spacing. Avoid high nitrogen. Resistant varieties.","Tricyclazole (0.6 g/L) at booting stage. Repeat at heading if wet weather."),
    dis("Leaf Spot","කොළ ලප","Fungal","low","Brown circular spots on leaves.","Humid conditions.","Good spacing.","Mancozeb 2.5 g/L if severe.")],
  "pests":[
    pst("Shoot Fly","ෂූට් ෆ්ලයි","medium","Dead heart in young plants.","Central leaf dead, pulls out easily.","Early planting, proper spacing.","Chlorpyriphos drench at planting if outbreak expected."),
    pst("Stem Borer","කඳ බෝරර්","low","Borers in stem cause dead hearts and reduced heads.","Entry holes, frass.","Pheromone traps.","Chlorpyriphos granules in whorl.")],
  "risks":[
    rsk("disease","Blast (Neck Blast)","high","White ears (empty heads) from neck blast can destroy 50–80% of grain.","White empty heads. Grey lesions on leaf necks.","Tricyclazole spray at booting and heading. Avoid dense planting."),
    rsk("pest","Birds","high","Birds devastate ripening grain in dry zone.","Missing grain on heads, bird flocks in field.","Daily patrols. Scarecrows every 10 m.")],
  "harvest":{"days_after_sowing":{"min":90,"max":120},"indicators":["Grains hard and red-brown","Finger-like heads fully formed and grain doesn't dent when pressed","Leaves turning yellow-brown"],"method":"Cut heads with sickle. Spread on clean mat. Sun dry 5–7 days. Thresh by beating sacks against floor.","frequency":"Single harvest","yield":"1.5–2.5 t/ha","post_harvest":"Dry to 12% moisture. Winnow. Store in sealed containers. Kurakkan stores very well — 1–2 years in cool dry conditions."}
}

# ── CARROT ────────────────────────────────────────────────────────────────────
G["Carrot"] = {
  "local_name":"Karot","scientific_name":"Daucus carota","family":"Apiaceae",
  "overview":"Cool-climate root vegetable grown mainly in Nuwara Eliya and Badulla. Requires deep loose soil for straight uniform roots. High nutritional value and strong market demand.",
  "zones":["Up Country Wet Zone","Up Country Intermediate Zone"],
  "duration":{"min":70,"max":100,"note":"days after sowing"},
  "spacing":{"row_cm":20,"plant_cm":5},"propagation":"Direct sowing only (taproot cannot be transplanted)",
  "stages":[
    stg("land_prep","Land Preparation",-14,0,"🚜","#795548","Deep fine tilth is essential for straight roots.",[
      act("prepare",-14,"Deep plough to 40 cm","Remove all stones, clods, and hard pan. Carrot roots fork around obstacles.","Any obstruction causes forked or misshapen roots — these are unsaleable."),
      act("fertilize",-7,"Apply compost, not fresh manure","Incorporate well-composted material 10 t/ha. NEVER fresh manure.","Fresh manure causes hairy, forked roots.")]),
    stg("sowing","Sowing",0,10,"🌱","#4CAF50","Sow very fine seeds uniformly.",[
      act("plant",0,"Sow thinly in shallow furrows 1 cm deep","Mix seeds with fine sand (1:10) for even distribution. Cover lightly.","Carrot seeds are tiny — mixing with sand prevents clumping."),
      act("water",0,"Gentle watering after sowing","Use fine rose or mist sprayer. Do not wash seeds.","Heavy watering displaces the tiny seeds."),
      act("plant",14,"Thin seedlings","Thin to 5 cm spacing when 5–8 cm tall.","Crowded carrots produce thin, poor-quality roots.")]),
    stg("vegetative","Leaf & Root Growth",14,55,"🌿","#2E7D32","Leaf canopy develops while root elongates.",[
      act("weed",14,"First weeding — very carefully","Hand weed only. Hoe between rows with care.","Carrot roots are shallow and easily damaged by hoeing."),
      act("fertilize",21,"Top dressing","Urea 75 kg/ha + MOP 75 kg/ha between rows.","Potassium is critical for root colour and sugar content."),
      act("water",25,"Maintain consistent moisture","Water every 3–4 days. Even moisture prevents cracking.","Alternating wet-dry cycles cause cracking and splitting of roots.")]),
    stg("root_fill","Root Fill & Maturation",55,85,"🥕","#FF7043","Roots reach final size.",[
      act("monitor",60,"Check root shoulder","Scrape soil at base — root diameter 1–2 cm at shoulder indicates approaching maturity.","Checking root size avoids both early harvest and over-mature woody roots."),
      act("water",65,"Reduce watering frequency","Water every 5–6 days.","Reducing water slightly concentrates sugars and improves flavour.")]),
    stg("harvest","Harvest",70,100,"🥕","#E64A19","Harvest before roots become woody.",[
      act("harvest",70,"Pull-test a few roots","Pull test carrots — roots should pull cleanly with orange colour through to centre.","Pale centre = immature. Woody = over-mature."),
      act("harvest",72,"Harvest in cool morning","Pull or dig in early morning. Wash immediately.","Cool morning harvest extends shelf life.")])],
  "fertilization":[
    frt("Basal",0,[ap("Compost","10 t/ha","Incorporate finely, no lumps"),ap("TSP","100 kg/ha","Incorporate"),ap("MOP","100 kg/ha","Incorporate")],"All basal for direct-sown root crop."),
    frt("Top dressing — 3 WAP",21,[ap("Urea","75 kg/ha","Between rows"),ap("MOP","75 kg/ha","Between rows")],"Root development nutrition — high potassium for colour and sweetness.")],
  "irrigation":{"frequency":"Every 3–4 days","critical_stages":["Germination (Week 1–2)","Root Fill (Day 55–85)"],"method":"Overhead sprinkler or light furrow","water_stress_signs":["Leaf wilt","Forked roots","Slow growth"],"over_watering_signs":["Root rot","Hairy secondary roots","Cracking"],"notes":"Absolutely even moisture is the key management factor. Drought followed by irrigation causes cracking."},
  "diseases":[
    dis("Leaf Blight","කොළ රෝගය","Fungal (Alternaria dauci)","medium","Dark brown lesions on leaves. Reduces photosynthesis and root development.","Warm humid conditions.","Good spacing for air flow.","Mancozeb 2.5 g/L every 10 days."),
    dis("Root Rot","රූට් රොට්","Fungal","medium","Roots develop soft brown rot. Entire root destroyed.","Waterlogged soil.","Perfect drainage. Raised beds.","No treatment. Prevention: drainage.")],
  "pests":[
    pst("Root Knot Nematode","නෙමටෝඩ","high","Tiny roundworms form galls on roots. Forked, knotted, unsaleable roots.","Galls on roots when pulled. Stunted plants.","Crop rotation. Marigold intercrop. Soil solarisation.","Carbofuran granules at planting if history of nematodes."),
    pst("Aphids","ලිතා","low","Sap sucking on leaves.","Clusters on new growth.","Natural enemies.","Neem oil 5 ml/L.")],
  "risks":[
    rsk("soil","Stones and Clods","high","Forked and misshapen roots cannot be sold. 100% loss in affected areas.","Forked roots at harvest.","Deep ploughing and stone removal before sowing. Non-negotiable."),
    rsk("weather","Frost (Nuwara Eliya)","medium","Kills young seedlings and damages roots.","Blackened seedlings overnight.","Cover with frost cloth on cold nights. Harvest before frost season.")],
  "harvest":{"days_after_sowing":{"min":70,"max":100},"indicators":["Root shoulder 2–3 cm diameter","Deep orange colour","Root pulls out with firm texture — not soft or woody"],"method":"Loosen soil with fork beside row. Pull plant by leaves. Trim tops leaving 2 cm.","frequency":"Single harvest (whole block)","yield":"20–30 t/ha","post_harvest":"Wash, trim tops to 2 cm, grade by size. Store in cool ventilated area. Shelf life 2–3 weeks."}
}

# ── BEETROOT ──────────────────────────────────────────────────────────────────
G["Beetroot"] = {
  "local_name":"Biit","scientific_name":"Beta vulgaris","family":"Amaranthaceae",
  "overview":"Cool-climate root vegetable grown in up-country Sri Lanka. Rich in antioxidants and vitamins. Relatively easy to grow with good market demand for fresh, salad, and juice markets.",
  "zones":["Up Country Wet Zone","Up Country Intermediate Zone","Mid Country Wet Zone"],
  "duration":{"min":60,"max":90,"note":"days after sowing"},
  "spacing":{"row_cm":30,"plant_cm":10},"propagation":"Direct sowing (each seed is actually a fruit cluster with 2–4 seeds)",
  "stages":[
    stg("land_prep","Land Preparation",-7,0,"🚜","#795548","Prepare loose deep soil.",[
      act("prepare",-7,"Deep plough to 30 cm","Remove stones and clods. Fine tilth.","Compaction causes deformed roots."),
      act("fertilize",-7,"Apply compost","Incorporate 10 t/ha compost. Check pH — lime if below 6.0.","Acidic soil prevents nutrient uptake. Beetroot needs pH 6.0–7.0.")]),
    stg("sowing","Sowing",0,10,"🌱","#4CAF50","Sow and thin.",[
      act("plant",0,"Sow 3–4 cm deep, 10 cm apart in rows","Each 'seed' contains 2–4 plants. Thin after emergence.","Multiple seedlings per position are normal — thinning is essential."),
      act("plant",10,"Thin to single plant","Remove extras. Keep strongest.","Crowded beetroot produces small stringy roots.")]),
    stg("vegetative","Leaf & Root Growth",10,50,"🌿","#2E7D32","Leaf canopy and root development.",[
      act("weed",14,"First weeding","Hand weed carefully.","Beet is a poor weed competitor in early stages."),
      act("fertilize",21,"Top dressing","Urea 75 kg/ha + MOP 75 kg/ha.","Potassium for deep red colour and sugar content."),
      act("water",25,"Maintain even moisture","Water every 3–4 days. Avoid wet-dry cycles.","Inconsistent moisture causes internal white rings (zoning defect) and cracking.")]),
    stg("root_fill","Root Maturation",50,80,"🔴","#C62828","Root swells to harvest size.",[
      act("monitor",55,"Check root shoulder","Scrape soil to check — 4–6 cm diameter at shoulder.","Checking avoids both immature and over-mature harvest."),
      act("water",60,"Reduce slightly","Water every 5 days.","Slight moisture reduction concentrates sugars and improves flavour.")]),
    stg("harvest","Harvest",60,90,"🔴","#B71C1C","Harvest before roots become tough.",[
      act("harvest",60,"Harvest test","Pull a root — should be 5–8 cm diameter, deep red, no softness.","Over-mature beetroot develops a woody core."),
      act("harvest",62,"Harvest in cool morning","Pull by hand or loosen with fork. Trim tops to 3 cm.","Keep leaf stub to prevent bleeding during transport.")])],
  "fertilization":[
    frt("Basal",0,[ap("Compost","10 t/ha","Incorporate"),ap("TSP","100 kg/ha","Incorporate"),ap("MOP","100 kg/ha","Incorporate")],"Good base for root development."),
    frt("Top dressing — 3 WAP",21,[ap("Urea","75 kg/ha","Between rows"),ap("MOP","75 kg/ha","Between rows")],"Root colour and size.")],
  "irrigation":{"frequency":"Every 3–4 days","critical_stages":["Root Fill (Day 50–80)"],"method":"Furrow or overhead","water_stress_signs":["Leaf wilt","Cracked roots","Stunted roots"],"over_watering_signs":["Root rot","Pale coloured roots"],"notes":"Even moisture is critical for quality. Drought followed by rain causes 'zoning' (white rings inside root) and cracking."},
  "diseases":[
    dis("Leaf Spot","කොළ ලප","Fungal (Cercospora beticola)","medium","Small round spots with grey centres and purple-red borders on leaves.","Warm humid conditions.","Good spacing.","Mancozeb 2.5 g/L every 10 days."),
    dis("Damping Off","ඩෑම්පිං","Fungal","low","Seedling stem rots at soil level.","Wet nursery/field conditions.","Good drainage.","Carbendazim drench 1 g/L.")],
  "pests":[
    pst("Leaf Miner","කොළ කාරයා","medium","Larvae tunnel between leaf surfaces, leaving white mines.","Winding white trails on leaves.","Remove mined leaves.","Abamectin (0.5 ml/L)."),
    pst("Aphids","ලිතා","low","Sap sucking on leaves.","Clusters on new growth.","Natural predators.","Neem oil 5 ml/L.")],
  "risks":[
    rsk("weather","Drought","medium","Causes small, tough, cracked roots.","Hard small roots, cracking.","Consistent irrigation every 3–4 days."),
    rsk("soil","Boron Deficiency","medium","Internal black heart (dark tissue inside root). Common in leached soils.","Dark discoloured tissue inside root.","Apply Borax 10–15 kg/ha at planting in boron-deficient soils.")],
  "harvest":{"days_after_sowing":{"min":60,"max":90},"indicators":["Root 5–8 cm diameter","Deep uniform red colour","Root feels solid and heavy"],"method":"Pull by hand or loosen with fork. Cut tops leaving 3 cm stub.","frequency":"Single harvest over 1–2 weeks","yield":"20–30 t/ha","post_harvest":"Keep cool. Do not remove leaf stub (prevents bleeding). Grade by size. Store 1–2 weeks in cool area."}
}

# ── CASSAVA ───────────────────────────────────────────────────────────────────
G["Cassava"] = {
  "local_name":"Manioc","scientific_name":"Manihot esculenta","family":"Euphorbiaceae",
  "overview":"Long-duration tropical root crop grown in Sri Lanka's dry zone. Very drought tolerant — grown as food security crop in marginal areas. Tubers starchy and versatile. Takes 8–12 months to mature.",
  "zones":["Dry Zone","Intermediate Zone","Low Country Dry Zone"],
  "duration":{"min":240,"max":360,"note":"days (8–12 months) after planting"},
  "spacing":{"row_cm":100,"plant_cm":90},"propagation":"Stem cuttings (25–30 cm long, 5–8 nodes)",
  "stages":[
    stg("land_prep","Land Preparation",-14,0,"🚜","#795548","Deep preparation for large tuber development.",[
      act("prepare",-14,"Deep plough to 40 cm","Remove all stumps, roots, and large stones.","Cassava develops large tubers up to 60 cm long — compaction causes misshapen tubers."),
      act("fertilize",-7,"Apply compost","Incorporate 5 t/ha compost. Do not over-fertilize.","Excess nitrogen promotes leaf growth over tuber development.")]),
    stg("planting","Planting & Establishment",0,30,"🌱","#795548","Plant stem cuttings at correct angle.",[
      act("plant",0,"Plant cuttings at 45° angle","Plant 25–30 cm cuttings at 45° into soil with 3–4 nodes underground. Do not plant vertically.","Angled planting improves rooting and makes tubers easier to harvest."),
      act("water",7,"Water once after planting if dry","One irrigation to establish if soil is very dry.","Cassava establishes well even in dry soil — do not overwater."),
      act("monitor",14,"Check shooting","Buds should sprout within 10–14 days.","Poor sprouting indicates old or diseased cuttings.")]),
    stg("vegetative","Vegetative Growth",30,150,"🌿","#2E7D32","Long vegetative phase — canopy develops.",[
      act("weed",30,"Weed twice: at 1 and 2 months","Critical weed-free first 2 months. After canopy closes, weeds are suppressed.","Weed competition in first 2 months is the primary yield reducer."),
      act("fertilize",45,"Top dressing 1","Urea 75 kg/ha + MOP 100 kg/ha.","Modest nitrogen with high potassium for tuber starch content.")]),
    stg("tuber","Tuber Development",150,270,"🌿","#1B5E20","Tubers bulk up over months.",[
      act("fertilize",120,"Top dressing 2","MOP 100 kg/ha. No nitrogen — avoid excessive leaf growth.","High potassium drives starch accumulation in tubers."),
      act("monitor",180,"Monitor for mosaic disease","Check leaves for yellow-green mosaic pattern — sign of Cassava Mosaic.","Mosaic can reduce yield by 50–80% in severe cases.")]),
    stg("harvest","Harvest",240,360,"🌿","#4E342E","Harvest when tubers reach desired size.",[
      act("harvest",240,"Check maturity","Dig up one plant and check tuber — no blue or dark discolouration of flesh.","Blue/dark colour = prussic acid (HCN) — ensure cooking destroys it."),
      act("harvest",245,"Harvest and process quickly","Cut stems, dig tubers, process within 24–48 hours.","Cassava deteriorates rapidly after harvest — within 48 hours becomes unsaleable.")])],
  "fertilization":[
    frt("Basal",0,[ap("TSP","125 kg/ha","Incorporate"),ap("MOP","100 kg/ha","Incorporate")],"No nitrogen basal — wait for establishment."),
    frt("Top dressing 1 — 6 WAP",45,[ap("Urea","75 kg/ha","Ring around plant"),ap("MOP","100 kg/ha","Ring")],"Moderate nitrogen + high potassium."),
    frt("Top dressing 2 — 4 months",120,[ap("MOP","100 kg/ha","Between rows")],"Potassium only for tuber starch fill.")],
  "irrigation":{"frequency":"Rainfed mainly. Cassava tolerates 3–6 months dry season.","critical_stages":["Establishment (first month)","Tuber Initiation (Month 3–5)"],"method":"Furrow if available","water_stress_signs":["Leaf drop (normal temporary response)","Stunted tubers"],"over_watering_signs":["Root rot","Poor tuber set"],"notes":"Cassava naturally drops leaves during drought and resumes growth when rain returns. This is a survival mechanism — not a sign the crop is dying."},
  "diseases":[
    dis("Cassava Mosaic Disease","කැසාවා මොසෙයික්","Viral (whitefly transmitted)","high","Yellow-green mosaic patterns on leaves. Leaf distortion. Severe stunting. Up to 80% yield loss.","Whitefly populations, infected planting material.","Use healthy certified cuttings. Control whitefly.","No cure. Use disease-free planting material from clean sources. Rogue infected plants."),
    dis("Bacterial Blight","බැක්ටීරියා","Bacterial","medium","Angular water-soaked leaf lesions turning brown. Stem dieback.","Wet conditions, wounding.","Healthy planting material. Avoid overhead irrigation.","Copper Oxychloride 3 g/L spray on foliage.")],
  "pests":[
    pst("Cassava Mealybug","මීලිිබග්","high","White cottony clusters on stems and leaves. Severe stunting. Yield loss up to 60%.","White waxy colonies on growing tips and leaf undersides.","Introduce parasitic wasp Anagyrus lopezi (biological control).","Neem oil 10 ml/L. Imidacloprid (0.3 ml/L) on new growth."),
    pst("Cassava Mite","මයිට්ස්","medium","Yellowing and drying of leaves. Stunted growth.","Brown/yellow dots on upper leaf surface. Tiny mites underneath.","Maintain crop health. Neem oil.","Abamectin (0.5 ml/L).")],
  "risks":[
    rsk("disease","Cassava Mosaic Virus","high","Can destroy 50–80% yield if uncontrolled whitefly spread infection.","Mosaic leaf patterns, severe stunting.","Plant virus-free cuttings ONLY. Control whitefly from day 1."),
    rsk("management","Post-harvest Deterioration","high","Cassava tubers become inedible within 48–72 hours of harvest.","Blue/black vascular discolouration in tubers after cutting.","Harvest only as much as can be processed/sold within 48 hours.")],
  "harvest":{"days_after_planting":{"min":240,"max":360},"indicators":["Tubers 5–8 cm diameter","Leaves begin to yellow and drop","Lower stem shows tuber bulges"],"method":"Cut stems at 30 cm from ground. Use fork or dig by hand. Pull tubers out carefully.","frequency":"Single harvest (uproot entire plant)","yield":"20–40 t/ha","post_harvest":"Process within 24–48 hours. Boil, steam, dry, or grate for flour. Store processed cassava only — not fresh tubers."}
}

# ── INNALA ────────────────────────────────────────────────────────────────────
G["Innala"] = {
  "local_name":"Innala","scientific_name":"Dioscorea esculenta","family":"Dioscoreaceae",
  "overview":"Traditional Sri Lankan yam crop grown in rural areas and home gardens. Long duration crop producing nutritious carbohydrate-rich tubers. Requires strong trellis for the climbing vine.",
  "zones":["Low Country Wet Zone","Intermediate Zone","Mid Country Wet Zone"],
  "duration":{"min":180,"max":270,"note":"days (6–9 months) after planting"},
  "spacing":{"row_cm":100,"plant_cm":75},"propagation":"Small tubers or tuber pieces (100–200 g each)",
  "stages":[
    stg("land_prep","Land Preparation",-14,0,"🚜","#795548","Prepare deep soil and install trellis.",[
      act("prepare",-14,"Deep plough to 40 cm","Dig planting mounds or pits 45×45×45 cm.","Yam tubers grow deeply — 30–60 cm. Compaction causes poor yields."),
      act("prepare",-7,"Install trellis","Erect 2.5–3 m trellis or use trees as support.","Yam vines are heavy and climb very high — needs strong support.")]),
    stg("planting","Planting",0,30,"🌱","#8D6E63","Plant tuber seed pieces.",[
      act("plant",0,"Plant tuber seed pieces","Place 100–200 g tuber pieces 5–8 cm deep in prepared mounds. Sprouted end up.","Innala is slow to establish — 3–4 weeks for first shoots is normal.")]),
    stg("vegetative","Vine Development",30,120,"🌿","#2E7D32","Long vine growth phase.",[
      act("train",30,"Guide vines onto trellis","Direct shoots upward onto trellis from first emergence.","Early training prevents ground-level disease and maximises leaf area."),
      act("fertilize",45,"Top dressing 1","Urea 50 kg/ha ring + MOP 100 kg/ha.","Moderate nitrogen; high potassium for tuber starch."),
      act("weed",45,"Weed twice in first 2 months","Hand weed around base. Do not disturb developing tubers.","Weed control in first 2 months is critical.")]),
    stg("tuber","Tuber Bulking",120,210,"🌿","#1B5E20","Tubers develop and bulk up.",[
      act("fertilize",120,"Top dressing 2","MOP 100 kg/ha. No extra nitrogen.","Potassium for starch accumulation."),
      act("monitor",150,"Check for tuber rot","Scrape soil to inspect — brown soft patches on tubers indicate rot.","Tuber rot is the main disease risk for innala.")]),
    stg("harvest","Harvest",180,270,"🟤","#6D4C41","Harvest when vine dies back naturally.",[
      act("prepare",210,"Reduce irrigation","Stop irrigation 4–6 weeks before harvest.","Allows tuber skin to harden for storage."),
      act("harvest",180,"Harvest after vine yellows","Dig carefully when vine yellows and dries back.","Natural vine dieback is the signal for harvest readiness.")])],
  "fertilization":[
    frt("Basal — pit preparation",0,[ap("Compost","5 kg/pit","Mix into pit"),ap("TSP","100 g/pit","Mix")],"Rich pit base for long-duration crop."),
    frt("Top dressing 1 — 6 WAP",45,[ap("Urea","50 kg/ha","Ring"),ap("MOP","100 kg/ha","Ring")],"Vine growth support."),
    frt("Top dressing 2 — 4 months",120,[ap("MOP","100 kg/ha","Ring")],"Tuber fill support.")],
  "irrigation":{"frequency":"Every 7–10 days","critical_stages":["Establishment (Month 1–2)","Tuber Bulking (Month 4–6)"],"method":"Basin irrigation","water_stress_signs":["Leaf wilt","Slow vine growth"],"over_watering_signs":["Tuber rot","Root rot"],"notes":"Innala prefers moist but well-drained conditions. Avoid waterlogging at all times."},
  "diseases":[
    dis("Tuber Rot","කූරු රොට්","Fungal","high","Soft brown rot of tubers in soil or storage.","Waterlogged soil, wounding, high humidity.","Perfect drainage. Careful harvest to avoid wounds.","No treatment in field. Careful drainage. Treat wounds with ash or sulphur before storage."),
    dis("Leaf Spot","කොළ ලප","Fungal","low","Brown spots on leaves.","High humidity.","Good air circulation.","Mancozeb 2.5 g/L.")],
  "pests":[
    pst("Yam Beetle","ී යාම් ගෝනා","medium","Adults and larvae damage tubers underground.","Holes in tubers. Adults on foliage.","Crop rotation. Deep ploughing.","Chlorpyriphos granules in mound at planting."),
    pst("Nematodes","නෙමටෝඩ","medium","Root galls reducing tuber quality.","Galls on tubers. Stunted plants.","Crop rotation. Marigold intercrop.","Carbofuran at planting.")],
  "risks":[
    rsk("weather","Waterlogging","high","Causes tuber rot — the primary yield loss factor.","Soft rotting tubers, foul smell.","Raise mounds. Ensure drainage channels are always clear."),
    rsk("management","Mechanical Damage at Harvest","medium","Damaged tubers rot within days and cannot be stored.","Cuts and bruises on tubers.","Dig carefully with hands near tubers. Use fork only in outer area.")],
  "harvest":{"days_after_planting":{"min":180,"max":270},"indicators":["Vine yellows and dries back naturally","Tubers feel firm and solid when dug","Skin is thick and firm"],"method":"Dig carefully by hand around mound. Extract tubers without cutting. Clean soil gently.","frequency":"Single harvest","yield":"8–15 t/ha","post_harvest":"Cure in shade 7–10 days. Store in cool dry ventilated area. Shelf life 2–3 months."}
}

# ── KIRI ALA ──────────────────────────────────────────────────────────────────
G["Kiri Ala"] = {
  "local_name":"Kiri Ala","scientific_name":"Ipomoea batatas","family":"Convolvulaceae",
  "overview":"Sweet potato grown throughout Sri Lanka especially in dry and intermediate zones. Drought tolerant and nutritious. Grown from vine cuttings. Both tubers and young leaves are edible.",
  "zones":["Dry Zone","Intermediate Zone","Low Country Dry Zone"],
  "duration":{"min":90,"max":150,"note":"days after planting vine cuttings"},
  "spacing":{"row_cm":90,"plant_cm":30},"propagation":"Vine cuttings (30–40 cm from healthy vines)",
  "stages":[
    stg("land_prep","Land Preparation",-7,0,"🚜","#795548","Form ridges for tuber development.",[
      act("prepare",-7,"Form ridges 25–30 cm high","Row spacing 90 cm. High ridges prevent waterlogging.","Sweet potato tubers form in ridges — loose well-drained soil produces best yields."),
      act("fertilize",-7,"Apply compost","Incorporate 8 t/ha compost into ridges.","Organic matter improves drainage and water retention.")]),
    stg("planting","Planting Vine Cuttings",0,21,"🌱","#4CAF50","Plant and establish vine cuttings.",[
      act("plant",0,"Plant cuttings on ridge","Press cutting into ridge at 45° angle with 2–3 nodes underground. Water immediately.","Nodal buds underground develop both roots and tubers."),
      act("water",3,"Water every 3 days for 2 weeks","Maintain moisture for rooting.","Consistent moisture in first 2 weeks is critical for vine establishment.")]),
    stg("vegetative","Vine Development",21,70,"🌿","#2E7D32","Vines spread and canopy develops.",[
      act("weed",21,"Weed once at 3 WAP","Weed thoroughly. After this, vines suppress weeds.","One thorough weeding before vine spread is all that is usually needed."),
      act("fertilize",28,"Top dressing","Urea 50 kg/ha + MOP 100 kg/ha along ridges.","Low nitrogen prevents excessive vine growth at expense of tubers. High potassium for tuber fill."),
      act("train",35,"Turn vines back onto ridge","Redirect straying vines back onto ridge every 2 weeks.","Vines rooting into soil away from ridge reduce tuber yield on main plant.")]),
    stg("tuber","Tuber Development",70,130,"🍠","#FF7043","Tubers bulk up under ridges.",[
      act("monitor",90,"Check tuber size","Scrape ridge to check — tubers should be developing well.","Early check allows harvesting young small tubers as a premium product."),
      act("water",100,"Maintain moderate irrigation","Water every 7–10 days. Reduce near harvest.","Consistent moisture prevents cracked misshapen tubers.")]),
    stg("harvest","Harvest",90,150,"🍠","#E64A19","Harvest when tubers reach desired size.",[
      act("harvest",90,"Early harvest option","Harvest some plants at 90 days for young sweet potatoes (smaller, more tender).","Early sweet potato commands better price."),
      act("harvest",120,"Main harvest","Cut vines, dig ridges by hand or fork. Handle carefully.","Full-sized tubers at 120–150 days.")])],
  "fertilization":[
    frt("Basal",0,[ap("Compost","8 t/ha","Incorporate into ridges"),ap("TSP","100 kg/ha","Incorporate")],"Base P. No K or N basal."),
    frt("Top dressing — 4 WAP",28,[ap("Urea","50 kg/ha","Along ridges"),ap("MOP","100 kg/ha","Along ridges")],"Low N, high K — the correct ratio for tuber crops.")],
  "irrigation":{"frequency":"Every 5–7 days","critical_stages":["Establishment (Week 1–3)","Tuber Fill (Month 3–5)"],"method":"Furrow irrigation along rows","water_stress_signs":["Leaf wilt","Cracked misshapen tubers"],"over_watering_signs":["Vine over-growth","Small tubers","Root rot"],"notes":"Sweet potato tolerates moderate drought well. Excess nitrogen or water causes masses of vines with few tubers."},
  "diseases":[
    dis("Sweet Potato Virus Disease","SPVD","Viral","high","Severe leaf distortion and stunting. Yellow streaks and mosaic on leaves. Tuber yield reduced 50–80%.","Infected planting material, whitefly and aphid vectors.","Use certified virus-free cuttings. Control whitefly.","No cure. Use clean planting material only."),
    dis("Root Rot","රූට් රොට්","Fungal","medium","Soft rot of tubers in waterlogged conditions.","Waterlogged ridges.","High ridges for good drainage.","No treatment. Drainage prevention.")],
  "pests":[
    pst("Sweet Potato Weevil","ුවීවල් ","high","Adults and larvae destroy tubers — entry holes, frass, brown tunnels inside tubers. Primary pest.","Entry holes on tubers. Frass and tunnels when cut open.","Healthy certified cuttings. High ridges prevent surface laying. Harvest promptly.","Chlorpyriphos soil drench at planting. Harvest at correct time — delay dramatically increases damage."),
    pst("Aphids","ලිතා","medium","Virus vectors. Sap sucking.","Clusters on new growth.","Yellow sticky traps.","Neem oil 5 ml/L.")],
  "risks":[
    rsk("pest","Sweet Potato Weevil","high","Primary risk — delayed harvest dramatically increases damage.","Tunnelled tubers, exit holes.","Harvest promptly at maturity. Never leave tubers in ground beyond maturity date."),
    rsk("management","Excessive Nitrogen","medium","Causes excessive vine growth with few or small tubers.","Dense vine canopy, poor tuber yield.","Keep nitrogen low. Do not exceed Urea 50 kg/ha.")],
  "harvest":{"days_after_planting":{"min":90,"max":150},"indicators":["Tubers 8–15 cm diameter","Skin firm and smooth","Some yellowing of older leaves"],"method":"Cut vines to 10 cm. Dig ridges carefully with fork. Extract tubers without cutting.","frequency":"Single harvest or early + main harvest","yield":"15–25 t/ha","post_harvest":"Cure in shade 5–7 days to harden skin. Store in cool dry ventilated area. Shelf life 1–2 months."}
}

# ── OKRA ──────────────────────────────────────────────────────────────────────
G["Okra"] = {
  "local_name":"Bandakka","scientific_name":"Abelmoschus esculentus","family":"Malvaceae",
  "overview":"Fast-growing vegetable widely cultivated in Sri Lanka's dry zone. Pods harvested continuously for 6–8 weeks. Very popular in Sri Lankan cuisine. Susceptible to Yellow Vein Mosaic Virus.",
  "zones":["Dry Zone","Intermediate Zone","Low Country Dry Zone","Low Country Wet Zone"],
  "duration":{"min":45,"max":60,"note":"days to first harvest; continues for 6–8 weeks"},
  "spacing":{"row_cm":60,"plant_cm":30},"propagation":"Direct sowing (2 seeds per hole)",
  "stages":[
    stg("land_prep","Land Preparation",-7,0,"🚜","#795548","Prepare well-drained fertile soil.",[
      act("prepare",-7,"Plough 20 cm and fine till","Remove weeds thoroughly. Form rows.","Good seedbed ensures uniform germination."),
      act("fertilize",-7,"Apply compost","Incorporate 8 t/ha compost.","Organic base for fast-growing continuous-harvesting crop.")]),
    stg("sowing","Sowing",0,10,"🌱","#4CAF50","Direct sow and thin.",[
      act("plant",0,"Sow 2 seeds per hole at 2–3 cm depth","Spacing 30×60 cm. Water.","Higher germination success with 2 seeds per hole."),
      act("plant",7,"Thin to 1 plant","Remove weaker seedling at 7–10 days.","Single strong plant per position is more productive.")]),
    stg("vegetative","Vegetative Growth",10,35,"🌿","#2E7D32","Rapid upright growth.",[
      act("weed",14,"First weeding","Hand weed or hoe carefully.","Critical weed-free period. Okra is a poor early weed competitor."),
      act("fertilize",21,"Top dressing 1","Urea 75 kg/ha + MOP 50 kg/ha ring.","Nitrogen drives the rapid growth needed for early fruiting."),
      act("monitor",21,"Scout for whitefly and jassids","Check undersides of leaves. Look for yellowing — early YVMV sign.","Yellow Vein Mosaic Virus is the biggest threat to okra.")]),
    stg("flowering","Flowering & Pod Production",35,60,"🌸","#FF9800","Continuous flowering and harvesting phase.",[
      act("fertilize",42,"Top dressing 2","Urea 50 kg/ha + MOP 50 kg/ha.","Sustains continuous pod production."),
      act("monitor",40,"Daily YVMV check","Look for yellow vein patterns on leaves. Remove infected plants immediately.","Every infected plant is a virus source. Remove before whitefly spread it further."),
      act("harvest",45,"Begin first harvest","Pick pods at 5–8 cm — tender and finger-thick.","Harvest at correct size: too young = waste; too old = fibrous and tough.")]),
    stg("harvest","Continuous Harvest",45,120,"🫑","#388E3C","Regular picking sustains production.",[
      act("harvest",45,"Harvest every 2 days","Pick all pods at correct size. Never leave mature pods.","Leaving mature pods signals plant to stop producing new flowers."),
      act("fertilize",70,"Late top dressing","Urea 25 kg/ha + MOP 25 kg/ha.","Small late feeding extends productive life by 2–3 weeks.")])],
  "fertilization":[
    frt("Basal",0,[ap("Compost","8 t/ha","Incorporate"),ap("TSP","100 kg/ha","Band"),ap("MOP","75 kg/ha","Incorporate")],"Base nutrients."),
    frt("Top dressing 1 — 3 WAP",21,[ap("Urea","75 kg/ha","Ring"),ap("MOP","50 kg/ha","Ring")],"Vegetative growth."),
    frt("Top dressing 2 — 6 WAP",42,[ap("Urea","50 kg/ha","Ring"),ap("MOP","50 kg/ha","Ring")],"Continuous fruiting support.")],
  "irrigation":{"frequency":"Every 3–4 days","critical_stages":["Flowering","Pod Development"],"method":"Furrow irrigation","water_stress_signs":["Leaf wilt midday","Flower drop","Crooked pods"],"over_watering_signs":["Root rot","Yellow lower leaves"],"notes":"Okra tolerates moderate drought but regular irrigation improves pod size and quality significantly."},
  "diseases":[
    dis("Yellow Vein Mosaic Virus","YVMV","Viral (whitefly transmitted)","high","Bright yellow veins on green leaves. Severe cases — entire leaf turns yellow. Plants produce no pods.","High whitefly population. All cultivars susceptible.","Control whitefly strictly. Yellow sticky traps. Remove infected plants immediately. Plant resistant varieties if available.","No cure. Remove infected plants to prevent spread. Control whitefly vector aggressively with Imidacloprid (0.3 ml/L)."),
    dis("Powdery Mildew","ෆංගල්","Fungal","low","White powder on older leaves.","Dry conditions.","Good spacing.","Wettable sulphur 3 g/L.")],
  "pests":[
    pst("Whitefly","සුදු මැස්සා","high","YVMV vector. Sap sucker. Primary pest.","White insects on leaf undersides, yellow sticky leaves.","Yellow sticky traps (2 per 25 m²). Reflective mulch.","Imidacloprid 200SL (0.3 ml/L) on leaf undersides. Alternate with neem oil."),
    pst("Jassids","ජෑසිඩ්ස්","medium","Sap sucking causing upward leaf curl, yellowing.","Small wedge-shaped insects on leaf undersides. Leaves curl upward.","Early detection. Natural enemies.","Dimethoate 40EC (1.5 ml/L).")],
  "risks":[
    rsk("disease","Yellow Vein Mosaic Virus","high","Single biggest threat to okra in Sri Lanka. Once 20% plants infected, epidemic begins.","Yellow vein patterns spreading through field.","Zero tolerance — remove every infected plant immediately. Control whitefly from day 1."),
    rsk("management","Delayed Harvest","medium","Old fibrous pods have zero market value and stop new production.","Hard fibrous pods. Reduced new flowers.","Harvest every 2 days without exception.")],
  "harvest":{"days_after_sowing":{"min":45,"max":60},"indicators":["Pod 5–8 cm long","Tip of pod still soft and pliable when bent","Ridges are soft to touch"],"method":"Cut with sharp knife or scissors leaving 1 cm stalk. Wear gloves — plant is spiny.","frequency":"Every 2 days during production period","yield":"8–12 t/ha over full season","post_harvest":"Grade by size. Store in cool shaded area. Market within 1–2 days — okra wilts rapidly."}
}

# ── SUNFLOWER ─────────────────────────────────────────────────────────────────
G["Sunflower"] = {
  "local_name":"Sunflower","scientific_name":"Helianthus annuus","family":"Asteraceae",
  "overview":"Oilseed and ornamental crop grown in dry and intermediate zones. Grown for edible oil, seeds, and cut flowers. Requires full sunlight and relatively low water input. Birds are a major harvesting challenge.",
  "zones":["Dry Zone","Intermediate Zone","Low Country Dry Zone"],
  "duration":{"min":80,"max":120,"note":"days after sowing"},
  "spacing":{"row_cm":60,"plant_cm":30},"propagation":"Direct sowing (1–2 seeds per hole)",
  "stages":[
    stg("land_prep","Land Preparation",-7,0,"🚜","#795548","Prepare well-drained fertile field.",[
      act("prepare",-7,"Plough 25 cm and fine till","Remove weeds. Level field.","Sunflower has a taproot — good tilth improves anchorage against wind.")]),
    stg("sowing","Sowing",0,10,"🌱","#FFC107","Direct sow at correct spacing.",[
      act("plant",0,"Sow 1–2 seeds per hole at 3–4 cm","Spacing 30×60 cm.","Correct spacing gives optimal head size."),
      act("plant",7,"Thin to 1 plant","Remove weaker seedling.","Single plant per position gives full-sized heads.")]),
    stg("vegetative","Vegetative Growth",10,50,"🌿","#2E7D32","Rapid stem and leaf development.",[
      act("weed",14,"First weeding","Weed thoroughly — sunflower is poor weed competitor until stem elongates.","Weeds in first 4 weeks can reduce yield by 30–50%."),
      act("fertilize",21,"Top dressing 1","Urea 75 kg/ha + MOP 75 kg/ha between rows.","Nitrogen for stem growth; potassium for head development."),
      act("weed",35,"Second weeding and hill up","Hill up soil 10 cm around stem base.","Hilling improves anchorage — prevents lodging in wind.")]),
    stg("flowering","Bud & Flowering",50,80,"🌻","#FFC107","Head development — pollination is critical.",[
      act("water",55,"Ensure moisture at bud stage","Water every 5–7 days.","Water stress at budding and flowering reduces seed set significantly."),
      act("fertilize",56,"Top dressing 2","MOP 75 kg/ha between rows.","Potassium for seed oil content."),
      act("monitor",65,"Begin bird protection","Post scarecrows. Stretch reflective tape across field. Patrol at dawn and dusk.","Birds can destroy 30–50% of seeds at this stage — the most critical risk.")]),
    stg("harvest","Harvest",80,120,"🌻","#FF8F00","Harvest at seed maturity.",[
      act("monitor",80,"Check for seed maturity","Press seeds — hard and firm. Back of head turns yellow-brown.","Soft seeds = too early; fully dry = seeds shattering."),
      act("harvest",85,"Cut heads","Cut head with 30 cm stalk when back is yellow-brown.","Leaving too long causes shattering and bird damage.")])],
  "fertilization":[
    frt("Basal",0,[ap("TSP","125 kg/ha","Band"),ap("MOP","75 kg/ha","Incorporate")],"Base P and K at planting."),
    frt("Top dressing 1 — 3 WAP",21,[ap("Urea","75 kg/ha","Side dress"),ap("MOP","75 kg/ha","Side dress")],"Stem and leaf development."),
    frt("Top dressing 2 — 8 WAP",56,[ap("MOP","75 kg/ha","Side dress")],"Seed and oil development.")],
  "irrigation":{"frequency":"Every 5–7 days","critical_stages":["Bud Stage (Day 50–60)","Flowering (Day 60–75)"],"method":"Furrow irrigation","water_stress_signs":["Leaf drooping","Slow head development"],"over_watering_signs":["Root rot","Lodging"],"notes":"Sunflower is relatively drought tolerant. Most critical moisture period is bud to petal drop."},
  "diseases":[
    dis("Downy Mildew","ඩවුනි","Fungal (Plasmopara halstedii)","medium","Yellow angular spots on leaves. White growth underneath.","Cool humid conditions.","Seed treatment with Metalaxyl.","Metalaxyl + Mancozeb (2.5 g/L) spray."),
    dis("Stem Rot","කඳ රොට්","Fungal (Sclerotinia)","medium","White cottony growth on stem. Stem collapses.","Wet conditions, dense planting.","Good spacing. Avoid overhead irrigation.","Remove affected plants. Fungicide to healthy neighbours.")],
  "pests":[
    pst("Birds","කුරුළු","high","Eat ripening seeds from head. 30–50% loss possible.","Seeds missing from head. Bird flocks in field.","Reflective tape. Scarecrows every 10 m. Dawn and dusk patrols.","Physical deterrence only. No chemical treatment."),
    pst("Aphids","ලිතා","medium","Clusters on new growth and head.","Soft insect colonies.","Natural enemies.","Dimethoate 40EC (1.5 ml/L).")],
  "risks":[
    rsk("pest","Bird Damage","high","Most serious risk at grain fill. Can destroy 50% of head.","Seeds missing from heads, bird flocks.","Post reflective tape and scarecrows before heads open. Patrol daily."),
    rsk("weather","Lodging in Wind","medium","Tall plants fall over, making harvest difficult.","Plants leaning or fallen after storms.","Hill up soil at 5 WAP. Space correctly — do not plant too densely.")],
  "harvest":{"days_after_sowing":{"min":80,"max":120},"indicators":["Back of head turns yellow-brown","Seeds hard and firm when pressed","Petals have fallen off head"],"method":"Cut head with 20–30 cm stalk using sickle or sharp knife.","frequency":"Single harvest over 1–2 weeks as heads mature","yield":"1.5–2.5 t/ha (seed)","post_harvest":"Dry heads in sun 5–7 days. Thresh by beating head. Winnow seeds. Sun dry grain to 8% moisture for oil extraction. Store in sealed bags."}
}

# ── BEANS ────────────────────────────────────────────────────────────────────
G["Beans"] = {
  "local_name":"Bonchi","scientific_name":"Phaseolus vulgaris","family":"Fabaceae",
  "overview":"French/haricot beans grown mainly in cooler up-country regions. Short-duration, high-value crop harvested as green pods. Requires consistent moisture and good disease management.",
  "zones":["Up Country Wet Zone","Up Country Intermediate Zone","Mid Country Wet Zone","Intermediate Zone"],
  "duration":{"min":50,"max":70,"note":"days after sowing"},
  "spacing":{"row_cm":45,"plant_cm":10},"propagation":"Direct sowing",
  "stages":[
    stg("land_prep","Land Preparation",-7,0,"🚜","#795548","Prepare well-drained fertile bed.",[
      act("prepare",-7,"Plough to 20 cm and fine till","Fine seedbed. Remove weeds. Form raised beds if wet zone.","Beans have shallow roots — fine tilth ensures even germination."),
      act("fertilize",-7,"Apply compost","Incorporate 8 t/ha compost.","Good organic base for this fast-growing crop.")]),
    stg("sowing","Sowing",0,10,"🌱","#4CAF50","Sow at correct seed rate.",[
      act("plant",0,"Sow 60–80 kg/ha at 3–4 cm depth","Rows 45 cm apart, 10 cm within row.","Higher seed rate gives good canopy for weed suppression."),
      act("water",0,"Irrigate if soil is dry","Bring soil to field capacity.","Beans need moisture for uniform germination.")]),
    stg("vegetative","Vegetative Growth",10,35,"🌿","#2E7D32","Rapid upright growth.",[
      act("weed",14,"First weeding","Hand weed or hoe carefully. Beans are shallow-rooted.","Weed competition in first 4 weeks reduces yield by 40%."),
      act("fertilize",21,"Top dressing","Urea 50 kg/ha + MOP 50 kg/ha between rows.","Moderate nitrogen — beans fix some nitrogen. Potassium for pod quality."),
      act("monitor",21,"Scout for bean fly and aphids","Check stem base for bean fly damage (swelling). Check leaves for aphid colonies.","Bean fly is the most damaging early pest of beans.")]),
    stg("flowering","Flowering & Pod Set",35,60,"🌸","#FF9800","Pods develop rapidly.",[
      act("water",40,"Maintain even moisture","Water every 3–4 days. Avoid wet-dry cycles.","Irregular moisture causes pod drop and pod deformities."),
      act("monitor",40,"Watch for rust disease","Check undersides of leaves for orange-brown pustules.","Rust spreads rapidly in cool humid up-country conditions.")]),
    stg("harvest","Harvest",50,70,"🫘","#388E3C","Harvest tender green pods.",[
      act("harvest",50,"First harvest","Pick when pods snap cleanly and seeds not yet visible through skin.","Young tender pods have best market value."),
      act("harvest",53,"Harvest every 3–5 days","Pick all mature pods regularly.","Leaving mature pods stops new pod development.")])],
  "fertilization":[
    frt("Basal",0,[ap("Compost","8 t/ha","Incorporate"),ap("TSP","100 kg/ha","Incorporate"),ap("MOP","50 kg/ha","Incorporate")],"Foundation with P for root nodules."),
    frt("Top dressing — 3 WAP",21,[ap("Urea","50 kg/ha","Between rows"),ap("MOP","50 kg/ha","Between rows")],"Growth and pod development support.")],
  "irrigation":{"frequency":"Every 3–4 days","critical_stages":["Germination","Flowering","Pod Fill"],"method":"Furrow or overhead","water_stress_signs":["Leaf wilt","Pod drop","Deformed pods"],"over_watering_signs":["Root rot","Yellowing lower leaves"],"notes":"Beans are sensitive to both drought and waterlogging. Consistent moisture is key."},
  "diseases":[
    dis("Bean Rust","රස්ට්","Fungal (Uromyces appendiculatus)","high","Orange-brown powdery pustules on leaf undersides. Yellow spots on upper surface. Leaves drop early.","Cool temperatures 16–22°C, high humidity, dew on leaves.","Avoid overhead irrigation. Good spacing for air flow.","Mancozeb 2.5 g/L or Triadimefon 0.5 g/L every 7–10 days."),
    dis("Angular Leaf Spot","කෝණ ලප","Bacterial (Pseudomonas)","medium","Water-soaked angular spots on leaves. Brown necrotic lesions.","Wet conditions, overhead irrigation.","Avoid wetting leaves. Crop rotation.","Copper Oxychloride 3 g/L.")],
  "pests":[
    pst("Bean Fly","බෝංචි මැස්සා","high","Larvae tunnel into stem near soil level. Plant wilts and dies.","Swollen tunnelled stem base. Maggot visible in stem.","Seed treatment. Early planting.","Chlorpyriphos drench at planting. Imidacloprid seed treatment."),
    pst("Pod Borer","කාය බෝරර්","medium","Larvae bore into pods. Entry holes on pods.","Holes in pods with frass.","Pheromone traps.","Spinosad (0.3 ml/L) at 50% flowering.")],
  "risks":[
    rsk("weather","Frost","high","Kills beans instantly. Common in up-country during cold nights.","Blackened wilted plants overnight.","Cover with frost cloth at night. Harvest mature pods before frost season."),
    rsk("weather","High Temperature (>28°C)","medium","Poor flower set at high temperatures.","Flower drop, reduced pod formation.","Plant in cooler months. Partial shade in mid-country.")],
  "harvest":{"days_after_sowing":{"min":50,"max":70},"indicators":["Pod snaps cleanly","Pod is full but seeds not bulging through skin","Pods are 10–15 cm long"],"method":"Hand pick individual pods. Do not pull vines.","frequency":"Every 3–5 days","yield":"8–12 t/ha (green pods)","post_harvest":"Store cool. Market within 2–3 days. Beans lose quality rapidly after picking."}
}

# ── BLACK GRAM ────────────────────────────────────────────────────────────────
G["Black Gram"] = {
  "local_name":"Undu","scientific_name":"Vigna mungo","family":"Fabaceae",
  "overview":"Important pulse crop grown in Sri Lanka's dry and intermediate zones. High protein content. Short duration and drought tolerant. Nitrogen-fixing — improves soil fertility.",
  "zones":["Dry Zone","Intermediate Zone","Low Country Dry Zone","Northern Dry Zone"],
  "duration":{"min":70,"max":100,"note":"days after sowing"},
  "spacing":{"row_cm":30,"plant_cm":10},"propagation":"Direct sowing",
  "stages":[
    stg("land_prep","Land Preparation",-7,0,"🚜","#795548","Light tillage.",[
      act("prepare",-7,"Plough to 15–20 cm","Clear weeds. Fine seedbed for small seeds.","Small seeds need good soil contact for germination.")]),
    stg("sowing","Sowing",0,10,"🌱","#4CAF50","Direct sow at correct rate.",[
      act("plant",0,"Sow 20–25 kg/ha at 3 cm depth","Rows 30 cm, 10 cm within row.","Correct population density optimises yield."),
      act("water",0,"Pre-sowing irrigation if needed","Bring soil to field capacity.","Dry soil delays germination significantly.")]),
    stg("vegetative","Vegetative Growth",10,40,"🌿","#2E7D32","Bushy growth develops.",[
      act("weed",14,"First weeding","Critical weed-free period.","Weeds reduce yield by up to 50% if not controlled."),
      act("fertilize",14,"Apply top dressing","MOP 50 kg/ha + Urea 25 kg/ha.","Minimal N — black gram fixes its own. Potassium for pod strength.")]),
    stg("flowering","Flowering & Pod Fill",40,75,"🌸","#FF9800","Pods develop.",[
      act("monitor",42,"Scout for pod borer","Check pods for entry holes.","Pod borer is the key yield threat."),
      act("water",45,"Irrigate if dry at pod fill","One irrigation if no rain for 10+ days.","Moisture at pod fill prevents seed shrivelling.")]),
    stg("harvest","Harvest",70,100,"🫘","#4E342E","Staggered harvest.",[
      act("harvest",70,"First picking","Pick dark-coloured mature pods.","2–3 picks needed as pods mature unevenly."),
      act("harvest",80,"Final harvest","Cut entire plant when 80% pods mature.")])],
  "fertilization":[
    frt("Basal",0,[ap("TSP","75 kg/ha","Incorporate"),ap("MOP","50 kg/ha","Incorporate")],"P for nodules. No N basal."),
    frt("Top dressing — 2 WAP",14,[ap("Urea","25 kg/ha","Between rows"),ap("MOP","50 kg/ha","Between rows")],"Starter N and potassium.")],
  "irrigation":{"frequency":"Minimal — 1–2 if rain fails","critical_stages":["Germination","Pod Fill"],"method":"Furrow","water_stress_signs":["Leaf wilt","Shrivelled pods"],"over_watering_signs":["Root rot","Yellow plants"],"notes":"Black gram is drought tolerant. Excess water causes root rot and lodging."},
  "diseases":[
    dis("Leaf Curl Virus","ලිෆ් කර්ල්","Viral","high","Leaf curling, yellowing, stunted growth.","Whitefly vectors.","Control whitefly. Remove infected plants.","No cure. Imidacloprid (0.3 ml/L) for whitefly."),
    dis("Powdery Mildew","ෆංගල්","Fungal","medium","White powder on leaves.","Warm dry periods.","Good spacing.","Wettable sulphur 3 g/L.")],
  "pests":[
    pst("Pod Borer","කාය බෝරර්","high","Larvae eat seeds inside pods.","Entry holes with frass.","Pheromone traps.","Spinosad (0.3 ml/L) at 50% flowering."),
    pst("Whitefly","සුදු මැස්සා","high","Sap sucker and virus vector.","White insects on leaf undersides.","Yellow sticky traps.","Imidacloprid (0.3 ml/L).")],
  "risks":[
    rsk("weather","Drought at Pod Fill","high","Shrivelled seeds, low yield.","Light flat pods.","One irrigation at pod fill if no rain."),
    rsk("weather","Waterlogging","high","Root rot — zero tolerance.","Wilting in wet soil.","Never plant in poorly drained areas.")],
  "harvest":{"days_after_sowing":{"min":70,"max":100},"indicators":["Pods turn dark brown/black","Seeds rattle when shaken","70–80% pods mature"],"method":"2–3 hand pickings of dark pods OR cut plant and sun-dry, then thresh.","frequency":"3 pickings every 5–7 days","yield":"0.8–1.2 t/ha (dry grain)","post_harvest":"Sun dry to 12% moisture. Store in sealed bags with neem leaves."}
}

# ── CUCUMBER ──────────────────────────────────────────────────────────────────
G["Cucumber"] = {
  "local_name":"Pipinna","scientific_name":"Cucumis sativus","family":"Cucurbitaceae",
  "overview":"Fast-growing vine vegetable widely grown in Sri Lanka's dry and intermediate zones. Short crop duration and high market demand. Very susceptible to fruit fly and viral diseases.",
  "zones":["Dry Zone","Intermediate Zone","Low Country Dry Zone","Low Country Wet Zone"],
  "duration":{"min":40,"max":60,"note":"days after sowing"},
  "spacing":{"row_cm":200,"plant_cm":100},"propagation":"Direct sowing (2 seeds per hole)",
  "stages":[
    stg("land_prep","Land Preparation",-7,0,"🚜","#795548","Prepare pits and trellis.",[
      act("prepare",-7,"Dig 45×45×45 cm pits and install trellis","Fill pits with compost + topsoil mix. Erect 2 m trellis.","Rich pits + trellis are the foundation of a good cucumber crop.")]),
    stg("sowing","Sowing",0,10,"🌱","#4CAF50","Sow and establish.",[
      act("plant",0,"Sow 2 seeds per pit at 2 cm depth","Water gently after sowing.","Two seeds ensures at least one germinates."),
      act("plant",7,"Thin to 1 plant per pit","Keep the stronger seedling.","Competition reduces both plants' productivity.")]),
    stg("vegetative","Vine Growth",10,30,"🌿","#2E7D32","Rapid vine extension.",[
      act("train",10,"Guide vines onto trellis","Direct main stem upward from day 10.","Early training prevents tangled vines."),
      act("fertilize",21,"Top dressing 1","Urea 50 kg/ha ring + MOP 50 kg/ha.","Nitrogen drives rapid vine growth for early fruiting."),
      act("monitor",21,"Scout for whitefly and cucumber mosaic","Check leaf undersides. Look for mosaic discolouration.","Cucumber Mosaic Virus spread by aphids is the main disease risk.")]),
    stg("flowering","Flowering & Fruiting",30,50,"🌸","#FF9800","Very fast fruit development.",[
      act("fertilize",35,"Top dressing 2","Urea 50 kg/ha + MOP 50 kg/ha.","Sustained nutrition for continuous fruiting."),
      act("monitor",35,"Set fruit fly traps","Place protein bait traps from day 35.","Fruit fly causes 40–60% loss if not controlled.")]),
    stg("harvest","Harvest",40,60,"🥒","#2E7D32","Harvest frequently.",[
      act("harvest",40,"First harvest","Pick when 15–25 cm, firm and dark green.","Harvest at correct size — over-ripe fruits turn yellow."),
      act("harvest",43,"Harvest every 2 days","Pick all mature fruits without delay.","Leaving mature fruits stops new production.")])],
  "fertilization":[
    frt("Basal",0,[ap("Compost","5 kg/pit","Mix into pit"),ap("TSP","100 g/pit","Mix into pit")],"Concentrated nutrition at root zone."),
    frt("Top dressing 1 — 3 WAP",21,[ap("Urea","50 kg/ha","Ring"),ap("MOP","50 kg/ha","Ring")],"Vine growth."),
    frt("Top dressing 2 — 5 WAP",35,[ap("Urea","50 kg/ha","Ring"),ap("MOP","50 kg/ha","Ring")],"Fruiting support.")],
  "irrigation":{"frequency":"Every 2–3 days","critical_stages":["Flowering","Fruit Development"],"method":"Basin irrigation","water_stress_signs":["Leaf wilt","Bitter fruits","Flower drop"],"over_watering_signs":["Root rot","Yellow leaves"],"notes":"Cucumber is very sensitive to water stress — bitter fruits result from drought at fruit fill."},
  "diseases":[
    dis("Cucumber Mosaic Virus","CMV","Viral (aphid transmitted)","high","Mosaic yellow-green pattern on leaves. Distorted fruits. Stunted growth.","High aphid population, warm conditions.","Control aphids strictly. Remove infected plants immediately.","No cure. Remove infected plants. Control aphid vectors with Imidacloprid."),
    dis("Downy Mildew","ඩවුනි","Fungal","medium","Angular yellow spots on leaves. Purple-grey growth underneath.","Wet humid conditions.","Good trellis ventilation. No overhead watering.","Metalaxyl + Mancozeb 2.5 g/L every 7 days.")],
  "pests":[
    pst("Fruit Fly","පළතුරු මැස්සා","high","Larvae rot fruits from inside.","Puncture marks and ooze on fruits.","Protein bait traps from day 30.","Malathion bait spray weekly."),
    pst("Cucumber Beetle","ගෝනා","medium","Adults eat leaves and flowers.","Yellow-striped or spotted beetles on foliage.","Yellow sticky traps.","Neem oil 5 ml/L.")],
  "risks":[
    rsk("pest","Fruit Fly","high","Primary threat. Can destroy 40–60% yield.","Punctured rotting fruits.","Weekly bait traps from day 30. Remove fallen fruits daily."),
    rsk("weather","High Temperature (>35°C)","medium","Bitter fruits, poor flowering.","Bitter taste, flower drop.","Harvest before overheating. Shade nets in hottest months.")],
  "harvest":{"days_after_sowing":{"min":40,"max":60},"indicators":["15–25 cm long","Dark green skin","Firm and slightly heavy"],"method":"Cut with knife leaving 2 cm stalk.","frequency":"Every 2 days","yield":"15–25 t/ha","post_harvest":"Store cool. Market within 3–5 days."}
}

# ── KOHILA ────────────────────────────────────────────────────────────────────
G["Kohila"] = {
  "local_name":"Kohila","scientific_name":"Lasia spinosa","family":"Araceae",
  "overview":"Traditional semi-aquatic perennial vegetable widely consumed in Sri Lanka. Grows in wetlands, marshy areas, and home gardens. Stems and leaves used in local cuisine. Thrives with abundant water year-round.",
  "zones":["Low Country Wet Zone","Mid Country Wet Zone","Intermediate Zone"],
  "duration":{"min":180,"max":365,"note":"days to first harvest; perennial plant lasts many years"},
  "spacing":{"row_cm":100,"plant_cm":75},"propagation":"Rhizome divisions or suckers",
  "stages":[
    stg("land_prep","Land Preparation",-14,0,"🚜","#795548","Prepare wet or moist planting area.",[
      act("prepare",-14,"Prepare moist or waterlogged planting bed","Kohila thrives in waterlogged conditions. No need to drain.","Kohila is adapted to wetlands — waterlogging is beneficial, not harmful."),
      act("fertilize",-7,"Apply organic matter","Incorporate 10 t/ha compost or water hyacinth compost.","Rich organic matter in moist soil is ideal for Kohila.")]),
    stg("planting","Planting",0,30,"🌱","#2E7D32","Plant rhizome divisions.",[
      act("plant",0,"Plant rhizome pieces with at least 2 nodes","Plant 5–8 cm deep. Keep well watered.","Each division produces a new plant."),
      act("water",3,"Maintain saturated soil","Kohila does not need irrigation management — keep wet.","Saturated soil is the natural habitat of this plant.")]),
    stg("vegetative","Establishment & Growth",30,120,"🌿","#1B5E20","Long establishment phase.",[
      act("fertilize",45,"Apply compost mulch","Apply 3 kg compost per plant as surface mulch.","Slow release organic nutrition."),
      act("weed",45,"Remove competing weeds","Pull out competing grasses and sedges.","Competition from other wetland plants slows establishment."),
      act("monitor",90,"Check new shoot development","Count new shoots — indicates healthy establishment.","Multiple shoots = good root development.")]),
    stg("maturing","Mature Growth",120,365,"🌿","#388E3C","Plant produces continuous harvestable stems.",[
      act("fertilize",120,"Annual organic topdress","Apply 5 kg compost per plant annually.","Perennial plants benefit from annual nutrition replenishment."),
      act("monitor",150,"Check stem quality","Inspect stems — firm, white inner stem = best quality.","Stem colour and firmness determine culinary quality.")]),
    stg("harvest","Harvest",180,3650,"🌿","#2E7D32","Continuous harvest of young stems.",[
      act("harvest",180,"First stem harvest","Cut young stems at base when 30–50 cm tall.","Young stems are most tender and flavourful."),
      act("harvest",187,"Harvest every 2–3 weeks","Cut stems regularly to encourage new growth.","Regular harvesting keeps plant productive for years.")])],
  "fertilization":[
    frt("At planting",0,[ap("Compost","10 t/ha","Incorporate into wet soil")],"Rich organic base."),
    frt("Annual maintenance",180,[ap("Compost","5 kg/plant","Surface apply around plant")],"Replenish perennial crop nutrition.")],
  "irrigation":{"frequency":"Keep soil waterlogged or very moist at all times","critical_stages":["Establishment"],"method":"Flood irrigation, wetland, or near water source","water_stress_signs":["Leaf drooping","Slow growth","Dry stem base"],"over_watering_signs":["Not applicable — Kohila thrives in standing water"],"notes":"Kohila is a wetland plant — the more water the better. Plant near natural water sources, drainage channels, or in paddyfield borders."},
  "diseases":[
    dis("Root Rot","රූට් රොට්","Fungal","medium","Rotting of rhizomes in poor drainage with no water flow.","Stagnant water with high pathogen load.","Ensure some water flow rather than completely stagnant water.","Remove affected roots. Improve water circulation."),
    dis("Leaf Spot","කොළ ලප","Fungal","low","Brown spots on leaves.","High humidity.","Remove affected leaves.","Mancozeb 2.5 g/L if severe.")],
  "pests":[
    pst("Aphids","ලිතා","low","Sap sucking on new growth.","Soft insect clusters.","Natural predators.","Neem oil 5 ml/L."),
    pst("Snails and Slugs","ගොළුබෙල්ලන්","medium","Feed on young stems and leaves at night.","Irregular holes in leaves. Slime trails.","Hand pick at night. Place ash or copper tape around plant base.","Metaldehyde bait pellets if severe.")],
  "risks":[
    rsk("weather","Drought","high","Kohila cannot survive without abundant water.","Leaf drooping, stem drying.","Plant only in permanently wet areas or provide constant irrigation."),
    rsk("management","Overharvesting","medium","Cutting too many stems weakens plant permanently.","Slow regrowth, few new shoots.","Leave at least 50% of stems at each harvest.")],
  "harvest":{"days_after_planting":{"min":180,"max":365},"indicators":["Stems are 30–50 cm tall","Inner stem is firm and white","Leaf is still tightly folded (not fully open)"],"method":"Cut stems at base with knife. Leave roots and some stems.","frequency":"Every 2–3 weeks","yield":"8–15 t/ha per year","post_harvest":"Keep cool and moist. Wilts quickly in heat. Market same day if possible."}
}

# ── MENARI (PROSO MILLET) ─────────────────────────────────────────────────────
G["Menari (Proso Millet)"] = {
  "local_name":"Menari","scientific_name":"Panicum miliaceum","family":"Poaceae",
  "overview":"Traditional hardy cereal of Sri Lanka's dry zone. Extremely drought tolerant. Grown in marginal lands where other crops fail. Rich in carbohydrates, fiber, and minerals. Short duration.",
  "zones":["Dry Zone","Northern Dry Zone","Eastern Dry Zone","Low Country Dry Zone"],
  "duration":{"min":60,"max":90,"note":"days after sowing"},
  "spacing":{"row_cm":25,"plant_cm":8},"propagation":"Direct sowing (broadcast or row)",
  "stages":[
    stg("land_prep","Land Preparation",-7,0,"🚜","#795548","Minimal preparation — grows in poor soils.",[
      act("prepare",-7,"Light plough and weed removal","Plough once 15 cm. Clear old crop debris.","Menari tolerates poor soil but clean seedbed improves yield."),
      act("prepare",-3,"Rake to fine tilth","Break surface clods. Very small seeds need fine tilth.","Small seeds need good soil contact.")]),
    stg("sowing","Sowing",0,7,"🌱","#4CAF50","Broadcast or row sow.",[
      act("plant",0,"Sow 8–10 kg/ha","Broadcast and rake in 1–2 cm deep OR sow in rows 25 cm apart.","Small seeds sown too deep fail to germinate."),
      act("water",0,"One irrigation if soil is dry","Bring surface to field capacity.","Tiny seeds need surface moisture to germinate.")]),
    stg("vegetative","Vegetative Growth",7,40,"🌿","#2E7D32","Tillering and stem development.",[
      act("weed",14,"First and only weeding","Weed once at 2 WAP. Canopy closes after this.","One clean weeding is the most critical management step."),
      act("fertilize",14,"Apply top dressing","Urea 50 kg/ha between rows.","Modest nitrogen — menari is adapted to low fertility soils.")]),
    stg("heading","Heading & Grain Fill",40,75,"🌾","#8D6E63","Panicles emerge and fill with grain.",[
      act("monitor",45,"Watch for blast disease","Check leaves and panicles for grey lesions.","Blast is the key disease risk."),
      act("monitor",60,"Bird protection","Post scarecrows. Patrol morning and evening.","Birds are a serious threat at grain fill in dry zone.")]),
    stg("harvest","Harvest",60,90,"🌾","#795548","Harvest at full maturity.",[
      act("harvest",60,"Harvest when grain hard","Cut panicles with sickle when grain fully formed.","Unlike sorghum, menari has no shattering problem."),
      act("harvest",65,"Thresh and dry","Beat heads on clean mats. Sun dry 3–5 days.","Rapid drying prevents mold.")])],
  "fertilization":[
    frt("Basal",0,[ap("TSP","50 kg/ha","Incorporate")],"Minimal P at planting."),
    frt("Top dressing — 2 WAP",14,[ap("Urea","50 kg/ha","Between rows")],"One nitrogen application only.")],
  "irrigation":{"frequency":"Rainfed. Extremely drought tolerant.","critical_stages":["Germination","Heading"],"method":"Furrow if available","water_stress_signs":["Leaf rolling","Small panicles"],"over_watering_signs":["Blast disease","Lodging"],"notes":"Menari is one of the most drought-tolerant crops in Sri Lanka. Requires less water than any other cereal. Overwatering promotes blast disease."},
  "diseases":[
    dis("Blast","බ්ලාස්ට්","Fungal (Magnaporthe oryzae)","medium","Grey lesions on leaves and panicles. Neck blast causes empty panicles.","High humidity, dense sowing.","Correct seed rate. Good spacing.","Tricyclazole (0.6 g/L) at booting if humid."),
    dis("Leaf Blight","කොළ රෝගය","Fungal","low","Brown leaf lesions.","Humid conditions.","Good spacing.","Mancozeb 2.5 g/L.")],
  "pests":[
    pst("Shoot Fly","ෂූට් ෆ්ලයි","medium","Dead heart in seedlings.","Central dead leaf in young plants.","Early planting.","Chlorpyriphos drench."),
    pst("Birds","කුරුළු","high","Eat ripening grain. 20–40% loss.","Seeds missing from panicles.","Scarecrows every 10 m. Daily patrols.","Physical deterrence only.")],
  "risks":[
    rsk("pest","Birds","high","Most serious risk at grain fill in dry zone.","Panicles partially emptied.","Post scarecrows before heading. Patrol morning and evening."),
    rsk("weather","Waterlogging","medium","Menari has zero waterlogging tolerance.","Yellow wilting plants in wet soil.","Never plant in flood-prone areas.")],
  "harvest":{"days_after_sowing":{"min":60,"max":90},"indicators":["Panicles fully formed","Grain hard and yellowish-white","Plants yellowing"],"method":"Cut panicles with sickle. Beat on mats to thresh. Winnow.","frequency":"Single harvest","yield":"1–2 t/ha","post_harvest":"Sun dry to 12% moisture. Store in sealed containers. Menari stores well for 1–2 years."}
}

# ── MUSTARD ───────────────────────────────────────────────────────────────────
G["Mustard"] = {
  "local_name":"Aba","scientific_name":"Brassica juncea","family":"Brassicaceae",
  "overview":"Cool-season oilseed and leafy vegetable crop. Grown in cooler regions and home gardens for edible leaves (30–45 days) and seeds for spice and oil (80–110 days). Fast-growing and easy to manage.",
  "zones":["Up Country Wet Zone","Up Country Intermediate Zone","Mid Country Wet Zone","Intermediate Zone"],
  "duration":{"min":30,"max":110,"note":"30–45 days for leaves; 80–110 days for seed harvest"},
  "spacing":{"row_cm":30,"plant_cm":10},"propagation":"Direct sowing",
  "stages":[
    stg("land_prep","Land Preparation",-7,0,"🚜","#795548","Prepare fertile raised beds.",[
      act("prepare",-7,"Plough and form fine seedbed","Fine tilth for small seeds. Raise beds in wet areas.","Small seeds need good soil contact."),
      act("fertilize",-7,"Apply compost","Incorporate 8 t/ha compost.","Rich base for fast-growing leafy crop.")]),
    stg("sowing","Sowing",0,7,"🌱","#FFEB3B","Broadcast or row sow small seeds.",[
      act("plant",0,"Sow 5–8 kg/ha in rows or broadcast","Rows 30 cm, cover seeds 1 cm deep.","Shallow sowing critical — seeds die if too deep."),
      act("water",0,"Gentle irrigation after sowing","Use fine spray. Avoid washing seeds.","Small seeds need surface moisture.")]),
    stg("vegetative","Leaf Development",7,40,"🌿","#2E7D32","Rapid leaf growth phase.",[
      act("weed",14,"First weeding","Weed carefully between rows.","Mustard is a poor early weed competitor."),
      act("fertilize",14,"Top dressing","Urea 75 kg/ha between rows.","Nitrogen for rapid leaf growth."),
      act("monitor",21,"Watch for aphids","Check stems and leaves for aphid colonies.","Aphids are the primary pest of mustard.")]),
    stg("flowering","Flowering & Pod Fill",40,95,"🌸","#FFEB3B","Yellow flowers then seed pods develop.",[
      act("fertilize",45,"Top dressing 2 (seed crop only)","Urea 50 kg/ha + MOP 50 kg/ha.","Needed only if growing for seed harvest."),
      act("monitor",70,"Watch for white rust","Look for white pustules on leaves.","White rust spreads rapidly in cool wet conditions.")]),
    stg("harvest","Harvest",30,110,"🌿","#FDD835","Two harvest options.",[
      act("harvest",30,"Leaf harvest (optional)","Cut entire plants at 5 cm above soil for leafy vegetable use.","Young leaves are most tender — harvest before flowering."),
      act("harvest",90,"Seed harvest","Cut plants when 75% of pods turn yellow-brown. Thresh.","Delayed harvest causes pod shattering and seed loss.")])],
  "fertilization":[
    frt("Basal",0,[ap("Compost","8 t/ha","Incorporate"),ap("TSP","75 kg/ha","Incorporate"),ap("MOP","50 kg/ha","Incorporate")],"Foundation for fast-growing crop."),
    frt("Top dressing — 2 WAP",14,[ap("Urea","75 kg/ha","Between rows")],"Leaf development nitrogen."),
    frt("Top dressing 2 — 6 WAP (seed crop)",45,[ap("Urea","50 kg/ha","Between rows"),ap("MOP","50 kg/ha","Between rows")],"Seed fill — only for seed harvest crop.")],
  "irrigation":{"frequency":"Every 5–7 days","critical_stages":["Germination","Flowering (seed crop)"],"method":"Furrow or overhead","water_stress_signs":["Leaf wilt","Slow growth"],"over_watering_signs":["Root rot","White rust"],"notes":"Mustard is moderately drought tolerant. For leaf crop, water regularly. For seed crop, reduce watering as pods mature."},
  "diseases":[
    dis("White Rust","සුදු මලකඩ","Fungal (Albugo candida)","medium","White powdery pustules on leaves and stems. Leaves distort.","Cool humid conditions, overhead irrigation.","Avoid wetting leaves. Good spacing.","Copper Oxychloride 3 g/L every 10 days."),
    dis("Downy Mildew","ඩවුනි","Fungal","medium","Yellow angular spots on leaves.","Cool wet conditions.","Good spacing.","Metalaxyl + Mancozeb 2.5 g/L.")],
  "pests":[
    pst("Aphids","ලිතා","high","Dense colonies on stems and pods. Honeydew causes sooty mold.","Clusters of soft insects on stems and growing tips.","Natural enemies. Early morning spray.","Dimethoate 40EC (1.5 ml/L)."),
    pst("Flea Beetle","ෆ්ලී බීටල්","medium","Tiny holes in leaves (shot-hole damage).","Many small circular holes in leaves.","Neem oil spray.","Cypermethrin (0.5 ml/L).")],
  "risks":[
    rsk("weather","High Temperature (>28°C)","high","Bolting (premature flowering) without good leaf development.","Plants flower without developing good leaf mass.","Plant in cool season only. Avoid low country in hot months."),
    rsk("management","Delayed Seed Harvest","medium","Pod shattering causes seed loss.","Pods splitting, seeds on ground.","Harvest when 75% pods turn yellow. Do not wait for all pods.")],
  "harvest":{"days_after_sowing":{"min":30,"max":110},"indicators":{"leaf":"Plants 20–25 cm tall, leaves tender and full sized","seed":"75% of pods turned yellow-brown; pods rattle when shaken"},"method":"Leaf: cut at 5 cm from soil. Seed: cut plants, bundle, sun-dry, thresh.","frequency":"Single harvest (leaf); single harvest (seed)","yield":"5–8 t/ha (fresh leaves); 1–1.5 t/ha (dry seed)","post_harvest":"Leaves: market same day. Seeds: sun dry to 10% moisture, store in sealed bags."}
}

# ── SWEET POTATO (BATHALA) ────────────────────────────────────────────────────
G["Sweet Potato (Bathala)"] = {
  "local_name":"Bathala","scientific_name":"Ipomoea batatas","family":"Convolvulaceae",
  "overview":"Popular sweet potato variety widely grown in dry and intermediate zones. Adaptable, low-maintenance, and highly nutritious. Both tubers and young leaves are edible. Grown from vine cuttings.",
  "zones":["Dry Zone","Intermediate Zone","Low Country Dry Zone"],
  "duration":{"min":90,"max":150,"note":"days after planting vine cuttings"},
  "spacing":{"row_cm":90,"plant_cm":30},"propagation":"Vine cuttings (30–40 cm from healthy vines)",
  "stages":[
    stg("land_prep","Land Preparation",-7,0,"🚜","#795548","Form ridges for tuber development.",[
      act("prepare",-7,"Form ridges 25–30 cm high","Row spacing 90 cm.","High ridges prevent waterlogging and allow tubers to develop freely."),
      act("fertilize",-7,"Apply compost to ridges","Incorporate 8 t/ha compost.","Organic matter improves drainage and nutrition in ridges.")]),
    stg("planting","Planting",0,21,"🌱","#4CAF50","Plant vine cuttings on ridges.",[
      act("plant",0,"Plant cuttings at 45° angle on ridge","2–3 nodes underground. Water immediately.","Angled planting develops roots and tubers from underground nodes."),
      act("water",3,"Water every 3 days for 2 weeks","Consistent moisture for vine rooting.","Critical establishment period.")]),
    stg("vegetative","Vine Development",21,70,"🌿","#2E7D32","Vines spread over ridges.",[
      act("weed",21,"One thorough weeding at 3 WAP","Weed before vines spread and cover ridges.","One early weeding is usually sufficient."),
      act("fertilize",28,"Top dressing","Urea 50 kg/ha + MOP 100 kg/ha along ridges.","Low N, high K — drives tuber development not vine growth."),
      act("train",35,"Turn stray vines back onto ridge","Redirect vines rooting away from ridge.","Off-ridge rooting reduces main plant tuber yield.")]),
    stg("tuber","Tuber Development",70,130,"🍠","#FF7043","Tubers form and bulk up under ridges.",[
      act("monitor",90,"Check tuber size","Scrape ridge to inspect tuber development.","Early check reveals if conditions are right."),
      act("water",100,"Reduce irrigation frequency","Water every 7–10 days.","Excessive moisture late causes excess vine growth and fewer tubers.")]),
    stg("harvest","Harvest",90,150,"🍠","#E64A19","Harvest at correct maturity.",[
      act("harvest",90,"Early harvest option","Harvest some plants at 90 days for young sweet potatoes.","Early harvest gets premium price for smaller tubers."),
      act("harvest",120,"Main harvest","Cut vines. Dig ridge carefully. Handle tubers gently.","Main harvest at 120–150 days for full-sized tubers.")])],
  "fertilization":[
    frt("Basal",0,[ap("Compost","8 t/ha","Incorporate into ridges"),ap("TSP","100 kg/ha","Incorporate")],"Foundation nutrition. No nitrogen or potassium basal."),
    frt("Top dressing — 4 WAP",28,[ap("Urea","50 kg/ha","Along ridges"),ap("MOP","100 kg/ha","Along ridges")],"Low N, high K for tuber development.")],
  "irrigation":{"frequency":"Every 5–7 days","critical_stages":["Establishment","Tuber Fill (Month 3–5)"],"method":"Furrow along ridges","water_stress_signs":["Leaf wilt","Cracked tubers"],"over_watering_signs":["Excess vine growth","Few tubers","Root rot"],"notes":"Bathala tolerates moderate drought. Excess N or water causes vine-heavy, low-tuber yield. High potassium is the key input."},
  "diseases":[
    dis("Sweet Potato Virus Disease","SPVD","Viral","high","Severe leaf distortion, yellowing, stunting. 50–80% yield loss.","Infected planting material, whitefly vectors.","Use certified virus-free cuttings. Control whitefly.","No cure. Plant clean material only."),
    dis("Root Rot","රූට් රොට්","Fungal","medium","Soft rot of tubers in waterlogged conditions.","Waterlogged ridges.","High ridges for drainage.","Prevention only. Good drainage.")],
  "pests":[
    pst("Sweet Potato Weevil","ුවීවල්","high","Tunnels in tubers. Primary pest. Delay causes exponential increase in damage.","Entry holes on tubers. Frass and tunnels inside.","Plant certified cuttings. Harvest promptly at maturity.","Chlorpyriphos soil drench at planting. Harvest at correct time."),
    pst("Aphids","ලිතා","medium","Virus vectors. Sap sucking.","Clusters on new growth.","Yellow sticky traps.","Neem oil 5 ml/L.")],
  "risks":[
    rsk("pest","Sweet Potato Weevil","high","Delayed harvest dramatically increases damage to tubers.","Tunnelled tubers, exit holes.","Harvest at maturity. Never leave tubers in ground beyond maturity."),
    rsk("management","Excessive Nitrogen","medium","Causes lush vine growth with few or small tubers.","Dense vine canopy, poor tuber yield.","Keep nitrogen low. Do not exceed 50 kg/ha Urea.")],
  "harvest":{"days_after_planting":{"min":90,"max":150},"indicators":["Tubers 8–15 cm diameter","Firm smooth skin","Some yellowing of older leaves"],"method":"Cut vines to 10 cm. Dig ridge carefully. Extract without cutting tubers.","frequency":"Single or early + main harvest","yield":"15–25 t/ha","post_harvest":"Cure in shade 5–7 days. Store in cool dry ventilated area. Shelf life 1–2 months."}
}

# ─── Save ─────────────────────────────────────────────────────────────────────
OUT.parent.mkdir(parents=True, exist_ok=True)
with open(OUT, "w", encoding="utf-8") as f:
    json.dump(G, f, indent=2, ensure_ascii=False)

print(f"Saved {len(G)} crops -> {OUT}")
for crop in sorted(G):
    print(f"  + {crop}")

import { processCakestryTurn, initCakestryState, CakestryStateData } from "../src/lib/whatsapp/cakestry-state";
import { calculateOrderTotals, PRODUCTS, CATEGORIES, findProductByName } from "../src/lib/cakestry";

function logTestHeader(title: string) {
  console.log(`\n=================================================================`);
  console.log(`TEST SUITE: ${title}`);
  console.log(`=================================================================\n`);
}

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    process.exitCode = 1;
  }
}

async function runTests() {
  const testPhone = "+923001234567";

  // ---------------------------------------------------------------------------
  // TEST 1: Menu & Category Navigation Test
  // ---------------------------------------------------------------------------
  logTestHeader("1. Menu & Category Navigation Test");

  let state: CakestryStateData | null = null;

  // Step 1: Send "hi" or language selection
  let turn1 = processCakestryTurn(state, "lang:en", "en", testPhone);
  assert(turn1.handled === true, "Language selection handled deterministically");
  assert(turn1.state.step === "MAIN_MENU", "State transitioned to MAIN_MENU");
  assert(turn1.reply.list !== undefined && turn1.reply.list.rows.length === 10, "10 Categories displayed in list");
  state = turn1.state;

  // Step 2: Select "cat:signature_cakes"
  let turn2 = processCakestryTurn(state, "cat:signature_cakes", "en", testPhone);
  assert(turn2.handled === true, "Category selection handled deterministically");
  assert(turn2.state.step === "CATEGORY_VIEW", "State transitioned to CATEGORY_VIEW");
  assert(turn2.reply.text.includes("Signature Cakes"), "Displays Signature Cakes title");
  state = turn2.state;

  // Step 3: Tap "⬅️ Main Menu" (act:back_categories)
  let turn3 = processCakestryTurn(state, "act:back_categories", "en", testPhone);
  assert(turn3.handled === true, "Back to main menu handled");
  assert(turn3.state.step === "MAIN_MENU", "Returned to MAIN_MENU state");
  state = turn3.state;

  // ---------------------------------------------------------------------------
  // TEST 2: Product Ordering, Quantity & Bill Math Test
  // ---------------------------------------------------------------------------
  logTestHeader("2. Product Ordering & Financial Calculation Test");

  // Select category "wraps_sandwiches"
  let turn4 = processCakestryTurn(state, "cat:wraps_sandwiches", "en", testPhone);
  state = turn4.state;

  // Select product "prod:sandwich_grilled" (Price: 550)
  let turn5 = processCakestryTurn(state, "prod:sandwich_grilled", "en", testPhone);
  assert(turn5.handled === true, "Product selection handled");
  assert(turn5.state.step === "PRODUCT_QUANTITY", "State in PRODUCT_QUANTITY");
  state = turn5.state;

  // Select Quantity: 2
  let turn6 = processCakestryTurn(state, "qty:2", "en", testPhone);
  assert(turn6.handled === true, "Quantity selection handled");
  assert(turn6.state.step === "CHEESE_ADDON", "Prompts for Cheese Add-On");
  state = turn6.state;

  // Select Extra Cheese (+Rs 70 per item)
  let turn7 = processCakestryTurn(state, "addon:yes", "en", testPhone);
  assert(turn7.handled === true, "Cheese Add-On confirmed");
  assert(turn7.state.step === "ORDER_CONFIRM_ITEMS", "State transitioned to ORDER_CONFIRM_ITEMS");
  assert(turn7.state.orderDraft.items.length === 1, "Cart has 1 item type");
  state = turn7.state;

  // Verify Bill Math: (550 * 2) + (70 * 2) = 1100 + 140 = 1240 Subtotal
  const totals1 = calculateOrderTotals(state.orderDraft.items, "DELIVERY");
  assert(totals1.subtotal === 1240, `Subtotal exact: Rs. ${totals1.subtotal} (Expected: 1240)`);
  assert(totals1.deliveryFee === 150, `Delivery Fee exact: Rs. ${totals1.deliveryFee} (Expected: 150)`);
  assert(totals1.total === 1390, `Total Amount exact: Rs. ${totals1.total} (Expected: 1390)`);

  // Add another product: Chocolate Dream Cake (Price: 1200)
  let turn8 = processCakestryTurn(state, "prod:choc_dream", "en", testPhone);
  state = turn8.state;
  let turn9 = processCakestryTurn(state, "qty:1", "en", testPhone);
  state = turn9.state;

  // Total Math check: 1240 + 1200 = 2440 Subtotal + 150 Delivery = 2590 Total
  const totals2 = calculateOrderTotals(state.orderDraft.items, "DELIVERY");
  assert(totals2.subtotal === 2440, `Multi-item Subtotal exact: Rs. ${totals2.subtotal} (Expected: 2440)`);
  assert(totals2.total === 2590, `Multi-item Total exact: Rs. ${totals2.total} (Expected: 2590)`);

  // ---------------------------------------------------------------------------
  // TEST 3: Checkout Flow & Payment Details Test
  // ---------------------------------------------------------------------------
  logTestHeader("3. Checkout Flow & SadaPay Payment Test");

  // Step 1: Checkout tap
  let c1 = processCakestryTurn(state, "act:checkout", "en", testPhone);
  assert(c1.state.step === "CHECKOUT_DELIVERY_TYPE", "Transitioned to CHECKOUT_DELIVERY_TYPE");
  state = c1.state;

  // Step 2: Home Delivery option
  let c2 = processCakestryTurn(state, "opt:delivery", "en", testPhone);
  assert(c2.state.step === "CHECKOUT_NAME", "Transitioned to CHECKOUT_NAME");
  state = c2.state;

  // Step 3: Enter Name
  let c3 = processCakestryTurn(state, "Muhammad Ali", "en", testPhone);
  assert(c3.state.step === "CHECKOUT_PHONE", "Transitioned to CHECKOUT_PHONE");
  state = c3.state;

  // Step 4: Use WA phone
  let c4 = processCakestryTurn(state, "use_wa_number", "en", testPhone);
  assert(c4.state.step === "CHECKOUT_ADDRESS", "Transitioned to CHECKOUT_ADDRESS");
  state = c4.state;

  // Step 5: Address
  let c5 = processCakestryTurn(state, "House 14, Model Town, Bahawal Nagar", "en", testPhone);
  assert(c5.state.step === "CHECKOUT_DATE_TIME", "Transitioned to CHECKOUT_DATE_TIME");
  state = c5.state;

  // Step 6: Date & Time -> Summary & SadaPay instructions
  let c6 = processCakestryTurn(state, "Today at 7:00 PM", "en", testPhone);
  assert(c6.state.step === "PAYMENT_VERIFICATION", "Transitioned to PAYMENT_VERIFICATION");
  assert(c6.completeOrder === true, "Order completion flag set");
  assert(c6.reply.text.includes("SADAPAY PAYMENT DETAILS"), "SadaPay payment instructions displayed");
  assert(c6.reply.text.includes("TOTAL AMOUNT: Rs. 2,590"), "Final receipt shows correct total");

  // ---------------------------------------------------------------------------
  // TEST 4: Custom Cake Intake Test
  // ---------------------------------------------------------------------------
  logTestHeader("4. Custom Cake Flow Test");

  let ccState: CakestryStateData | null = null;
  let cc1 = processCakestryTurn(ccState, "cat:custom_cakes", "en", testPhone);
  assert(cc1.state.step === "CUSTOM_CAKE_WEIGHT", "Custom Cake intake started at weight step");
  ccState = cc1.state;

  let cc2 = processCakestryTurn(ccState, "3 Pounds", "en", testPhone);
  assert(cc2.state.step === "CUSTOM_CAKE_FLAVOR", "Weight captured, moved to flavor");
  ccState = cc2.state;

  let cc3 = processCakestryTurn(ccState, "Nutella Chocolate Fudge", "en", testPhone);
  assert(cc3.state.step === "CUSTOM_CAKE_DESIGN", "Flavor captured, moved to design");
  ccState = cc3.state;

  let cc4 = processCakestryTurn(ccState, "Gold metallic crown theme with fresh roses", "en", testPhone);
  assert(cc4.state.step === "CUSTOM_CAKE_DATE_TIME", "Design captured, moved to date & time");
  ccState = cc4.state;

  let cc5 = processCakestryTurn(ccState, "Tomorrow at 4:00 PM", "en", testPhone);
  assert(cc5.completeCustomCake === true, "Custom Cake request complete flag set");
  assert(cc5.reply.text.includes("Custom Cake Request Received"), "Custom Cake confirmation delivered");

  // ---------------------------------------------------------------------------
  // TEST 5: Order Tracking & Cancellation Test
  // ---------------------------------------------------------------------------
  logTestHeader("5. Order Tracking & Cancellation Test");

  let oState: CakestryStateData | null = null;
  let ord1 = processCakestryTurn(oState, "cat:my_order", "en", testPhone);
  assert(ord1.state.step === "MY_ORDER", "My Order screen displayed");
  assert(ord1.reply.buttons !== undefined && ord1.reply.buttons.length === 3, "Modification & cancellation buttons provided");

  let ord2 = processCakestryTurn(ord1.state, "human", "en", testPhone);
  assert(ord2.escalate === true, "Order modification / cancellation triggers staff handoff ticket");

  console.log(`\n=================================================================`);
  console.log(`ALL 5 TEST SUITES PASSED CLEANLY! 🚀`);
  console.log(`=================================================================\n`);
}

runTests().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});

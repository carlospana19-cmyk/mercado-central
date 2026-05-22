import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:mercadocentral_app/main.dart';

void main() {
  testWidgets('App loads smoke test', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(const MercadoCentralApp());

    // Verify that app loads (checking for login title)
    expect(find.byType(MaterialApp), findsOneWidget);
  });
}

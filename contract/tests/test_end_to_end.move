#[test_only]
module VeriFiPublisher::test_end_to_end;

use VeriFiPublisher::message_board;
use std::string;

#[test(sender = @VeriFiPublisher)]
fun test_end_to_end(sender: &signer) {
    message_board::init_module_for_test(sender);

    message_board::post_message(sender, string::utf8(b"hello world"));

    let string_content = message_board::get_message_content();
    assert!(string_content == string::utf8(b"hello world"), 3);

    // Post again, should overwrite the old message
    message_board::post_message(sender, string::utf8(b"hello aptos"));

    let string_content = message_board::get_message_content();
    assert!(string_content == string::utf8(b"hello aptos"), 16);
}

# https://github.com/opal/opal/pull/1426 - fixed in 0.10
# https://github.com/opal/opal/issues/1427 - fixed in 0.10
# begin
#   Opal::Compiler.new('def problem', {}).compile
# rescue Exception => e
#   binding.pry
#   unless e.is_a?(SyntaxError) && e.message == "An error occurred while compiling: (file)\n\nunexpected 'false'\nSource: (file):1:11
# def problem\n~~~~~~~~~~^"
#     class Opal::Compiler
#       def compile
#         @parser = Parser.new

#         @sexp = s(:top, @parser.parse(@source, self.file) || s(:nil))
#         @eof_content = @parser.lexer.eof_content

#         @fragments = process(@sexp).flatten

#         @result = @fragments.map(&:code).join('')
#       rescue Exception => error
#         message = "An error occurred while compiling: #{self.file}\n#{error.message}"
#         raise error.class, message, error.backtrace
#       end
#     end
#   end
# end
